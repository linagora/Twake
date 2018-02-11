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

	var $doctrine;
	public function __construct($doctrine, $pusher){
		$this->doctrine = $doctrine;
		$this->pusher = $pusher;
	}

	public function pushNotification($application, $workplace, $users = null, $levels = null, $code = null, $text = null, $type = Array())
	{

		$data = Array(
			"type"=>"add",
			"workspace_id"=>$workplace->getId(),
			"app_id"=>$application->getId(),
			"text" => $text,
			"code" => $code,
			"type" => $type
		);

		foreach ($users as $user) {
			$n = new Notification($application, $workplace, $user);
			if($code){
				$n->setCode($code);
			}
			if($text){
				$n->setText($text);
			}
			$this->doctrine->persist($n);

			if(in_array("push", $type)){
				$this->pushDevice($application, $workplace, $user, $text);
			}
			if(in_array("mail", $type)){
				$this->sendMail($application, $workplace, $user, $text);
			}

			$this->pusher->push($data, "notifications_topic", Array("id_user" => $user->getId()));
		}

		$this->doctrine->flush();

	}

	public function readAll($application, $workplace, $user, $code = null)
	{

		$nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
		if(!$code){
			$notif = $nRepo->findBy(Array(
				"workspace"=>$workplace,
				"application"=>$application,
				"user"=>$user
			));
		}else{
			$notif = $nRepo->findBy(Array(
				"workspace"=>$workplace,
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
			"workspace_id"=>$workplace->getId(),
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
	private function pushDevice($application, $workplace, $user, $text){
		//TODO
	}

	private function sendMail($application, $workplace, $user, $text){
		//TODO
	}
}
