<?php


namespace WebsiteApi\NotificationsBundle\Services;
use ApnsPHP_Abstract;
use ApnsPHP_Message;
use ApnsPHP_Push;
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

		$title = "";
		if($workspace->getGroup()){
			$title .= $workspace->getGroup()->getDisplayName() . " - ";
		}
		$title .= $workspace->getName() . " : ";
		$title .= $application->getName();


		$data = Array(
			"type"=>"add",
			"workspace_id"=>$workspace->getId(),
			"app_id"=>$application->getId(),
			"title" => $title,
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
				$this->pushDevice($user, $text, $title);
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
	private function pushDevice($user, $text, $title){

		$devicesRepo = $this->doctrine->getRepository("TwakeUsersBundle:Device");
		$devices = $devicesRepo->findBy(Array("user"=>$user));
		foreach ($devices as $device) {
			if($device->getType()=="APNS"){
				$token = $device->getValue();

				$push = new ApnsPHP_Push(
					ApnsPHP_Abstract::ENVIRONMENT_SANDBOX,
					'server_certificates_bundle_sandbox.pem'
				);
				$push->setRootCertificationAuthority(dirname(__FILE__).$this->apns_file);
				$push->connect();

				$message = new ApnsPHP_Message($token);
				$message->setText($text);
				$message->setTitle($title);
				$message->setBadge(1);
				$message->setSound();

				$push->add($message);
				$push->send();
				$push->disconnect();

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
