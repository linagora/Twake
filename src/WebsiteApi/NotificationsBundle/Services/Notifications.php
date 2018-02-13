<?php


namespace WebsiteApi\NotificationsBundle\Services;
use RMS\PushNotificationsBundle\Message\AndroidMessage;
use RMS\PushNotificationsBundle\Message\iOSMessage;
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

	var $doctrine;

	public function __construct($doctrine, $pusher, $mailer, $rms_push_notifications, $krlove_async){
		$this->doctrine = $doctrine;
		$this->pusher = $pusher;
		$this->mailer = $mailer;
		$this->rms_push_notifications = $rms_push_notifications;
		$this->krlove_async = $krlove_async;
	}

	public function pushNotification($application, $workspace, $users = null, $levels = null, $code = null, $text = null, $type = Array())
	{
		$this->krlove_async->call(
			'app.notifications',
			'pushNotificationAsync',
			Array($application, $workspace, $users, $levels, $code, $text, $type));
	}

	public function pushNotificationAsync($application, $workspace, $users = null, $levels = null, $code = null, $text = null, $type = Array())
	{

		$title = "";
		if($workspace->getGroup()){
			$title .= $workspace->getGroup()->getDisplayName() . " - ";
			$title .= $workspace->getName() . " : ";
		}else{
			$title .= "Private - ";
		}
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
				$totalNotifications = $this->countAll($user);
				@$this->pushDevice($user, $text, $title, $totalNotifications);
			}
			if(in_array("mail", $type)){
				@$this->sendMail($application, $workspace, $user, $text);
			}

			$data["action"] = "add";
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

		$totalNotifications = $this->countAll($user);

		$read = $totalNotifications;
		foreach ($notif as $n) {
			$read+=-1;
			$this->doctrine->remove($n);
		}
		$this->doctrine->flush();

		$data = Array(
			"action"=>"remove",
			"workspace_id"=>$workspace->getId(),
			"app_id"=>$application->getId()
		);
		$this->pusher->push($data, "notifications_topic", Array("id_user" => $user->getId()));

		$this->updateDeviceBadge($user, $read);

	}

	public function countAll($user)
	{
		$qb = $this->em->createQueryBuilder();
		$qb = $qb->select('count(n.id)')
			->where('n.user = :user')
			->setParameter('user', $user)
			->from('TwakeNotificationsBundle:Notification','n');

		return $qb->getQuery()->getSingleScalarResult();
	}

	public function getAll($user)
	{
		$nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
		$notifs = $nRepo->findBy(Array("user"=>$user));

		return $notifs;
	}


	/* Private */
	private function updateDeviceBadge($user, $badge=0){
		$devicesRepo = $this->doctrine->getRepository("TwakeUsersBundle:Device");
		$devices = $devicesRepo->findBy(Array("user"=>$user));
		foreach ($devices as $device) {
			if($device->getType()=="APNS"){

				$token = $device->getValue();

				$message = new iOSMessage();
				$message->setAPSBadge($badge);
				$message->setDeviceIdentifier($token);

				$this->rms_push_notifications->send($message);

			}
			if($device->getType()=="GCM"){

				//TODO

			}
		}
	}

	private function pushDevice($user, $text, $title, $badge=null){

		$devicesRepo = $this->doctrine->getRepository("TwakeUsersBundle:Device");
		$devices = $devicesRepo->findBy(Array("user"=>$user));
		foreach ($devices as $device) {
			if($device->getType()=="APNS"){

				$token = $device->getValue();
				$data = array(
					"title"=>substr($title, 0, 50),
					"body"=>substr($text, 0, 100)
				);

				$message = new iOSMessage();
				$message->setMessage($data);
				if($badge) {
					$message->setAPSBadge($badge);
				}
				$message->setAPSSound("default");
				$message->setDeviceIdentifier($token);

				$this->rms_push_notifications->send($message);

			}
			if($device->getType()=="GCM"){

				$token = $device->getValue();
				$data = array(
					"title"=>substr($title, 0, 50),
					"message"=>substr($text, 0, 100)
				);

				$message = new androidMessage();
				$message->setMessage($data);
				$message->setGCM(true);
				$message->setDeviceIdentifier($token);

				$this->rms_push_notifications->send($message);

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
