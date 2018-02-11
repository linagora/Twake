<?php


namespace WebsiteApi\NotificationsBundle\Services;
use WebsiteApi\NotificationsBundle\Entity\Notification;
use WebsiteApi\NotificationsBundle\Model\NotificationsInterface;

/**
 * Class Notifications
 * @package WebsiteApi\UsersBundle\Services
 *
 * Gestion des notifications
 */
class Notifications implements NotificationsInterface
{

	var $apns_url = "gateway.sandbox.push.apple.com";
	var $apns_file = "apns_dev.pem";

	var $doctrine;
	public function __construct($doctrine, $pusher, $mailer){
		$this->doctrine = $doctrine;
		$this->pusher = $pusher;
		$this->mailer = $mailer;
	}

	public function pushNotification($application, $workspace, $users = null, $levels = null, $code = null, $text = null, $type = Array())
	{

		$data = Array(
			"type"=>"add",
			"workspace_id"=>$workspace->getId(),
			"app_id"=>$application->getId(),
			"text" => $text,
			"code" => $code,
			"type" => $type
		);

		foreach ($users as $user) {
			$n = new Notification($application, $workspace, $user);
			if($code){
				$n->setCode($code);
			}
			if($text){
				$n->setText($text);
			}
			$this->doctrine->persist($n);

			if(in_array("push", $type)){
				$this->pushDevice($application, $workspace, $user, $text);
			}
			if(in_array("mail", $type)){
				$this->sendMail($application, $workspace, $user, $text);
			}

			$this->pusher->push($data, "notifications_topic", Array("id_user" => $user->getId()));
		}

		$this->doctrine->flush();

	}

	public function readAll($application, $workspace, $user, $code = null)
	{

		$nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
		if(!$code){
			$notif = $nRepo->findBy(Array(
				"workspace"=>$workspace,
				"application"=>$application,
				"user"=>$user
			));
		}else{
			$notif = $nRepo->findBy(Array(
				"workspace"=>$workspace,
				"application"=>$application,
				"user"=>$user,
				"code"=>$code
			));
		}
		foreach ($notif as $n) {
			$this->doctrine->remove($n);
		}
		$this->doctrine->flush();

		$data = Array(
			"type"=>"remove",
			"workspace_id"=>$workspace->getId(),
			"app_id"=>$application->getId()
		);
		$this->pusher->push($data, "notifications_topic", Array("id_user" => $user->getId()));
	}

	public function getAll($user)
	{
		$nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
		$notifs = $nRepo->findBy(Array("user"=>$user));

		return $notifs;
	}


	/* Private */
	private function pushDevice($application, $workspace, $user, $text){
		$devicesRepo = $this->doctrine->getRepository("TwakeUsersBundle:Device");
		$devices = $devicesRepo->findAllBy(Array("user"=>$user));
		foreach ($devices as $device) {
			if($device->getType()=="APNS"){
				$token = $device->getValue();
				$data = array(
					'alert' => $workspace->getName()." > ".$application->getName()." > ".$text,
					'badge' => 1,
					'sound' => 'default'
				);

				$apnsHost = $this->apns_url;
				$apnsCert = dirname(__FILE__).$this->apns_file;
				$apnsPort = 2195;
				$streamContext = stream_context_create();
				stream_context_set_option($streamContext, 'ssl', 'local_cert', $apnsCert);
				$apns = stream_socket_client('ssl://' . $apnsHost . ':' . $apnsPort, $error, $errorString, 2, STREAM_CLIENT_CONNECT, $streamContext);
				$payload['aps'] = $data;
				$output = json_encode($payload);
				$token = pack('H*', str_replace(' ', '', $token));
				$apnsMessage = chr(0) . chr(0) . chr(32) . $token . chr(0) . chr(strlen($output)) . $output;
				fwrite($apns, $apnsMessage);
				socket_close($apns);
				fclose($apns);

			}
			if($device->getType()=="GCM"){
				//TODO
			}
		}
	}

	private function sendMail($application, $workspace, $user, $text){
		$this->mailer->send($user->getEmail(), "notification", Array(
			"application_name"=>$application->getName(),
			"workspace_name"=>$workspace->getName(),
			"username"=>$user->getUsername(),
			"text"=>$text
		));
	}
}
