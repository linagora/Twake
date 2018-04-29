<?php


namespace WebsiteApi\NotificationsBundle\Services;
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
	var $circle;
	var $pushNotificationServer;

	public function __construct($doctrine, $pusher, $mailer, $circle, $pushNotificationServer){
		$this->doctrine = $doctrine;
		$this->pusher = $pusher;
		$this->mailer = $mailer;
		$this->circle = $circle;
        $this->pushNotificationServer = $pushNotificationServer;
	}

	public function pushNotification($application = null, $workspace = null, $users = null, $levels = null, $code = null, $text = null, $type = Array(), $data=null)
	{

		if($workspace != null){
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }

		if($application != null) {
			$application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($application);
		}

		$title = "";
		if ($workspace && $workspace->getGroup()) {
			$title .= $workspace->getGroup()->getDisplayName() . " - ";
			$title .= $workspace->getName() . " : ";
		} else {
			$title .= "Private : ";
		}
		if($application){
			$title .= $application->getName();
		}

		$data = Array(
			"type"=>"add",
			"workspace_id"=>($workspace!=null?$workspace->getId():null),
			"app_id"=>($application!=null?$application->getId():null),
			"title" => $title,
			"text" => $text,
			"code" => $code,
			"type" => $type
		);

        $count = count($users);
        for($i = 0; $i < $count; $i++) {

			$user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($users[$i]);

			//Verify that user want this notification

			$notificationPreference = $user->getNotificationPreference();
			$useDevices = false;
			if($notificationPreference["devices"]==0){
				$useDevices = true;
			}
			if($notificationPreference["devices"]==1 && !$user->isConnected()){
				$useDevices = true;
			}
			if($useDevices) {
				$currentDate = gmdate("H") + floor(gmdate("i") / 30) / 2;
				if ($notificationPreference["dont_disturb_between"] != null && $notificationPreference["dont_disturb_and"] != null) {

					if ($notificationPreference["dont_disturb_between"] < $notificationPreference["dont_disturb_and"]
						&& $currentDate >= $notificationPreference["dont_disturb_between"]
						&& $currentDate < $notificationPreference["dont_disturb_and"]
					) {
						$useDevices = false;
					}
					if ($notificationPreference["dont_disturb_between"] > $notificationPreference["dont_disturb_and"]
						&& ($currentDate >= $notificationPreference["dont_disturb_between"]
							|| $currentDate < $notificationPreference["dont_disturb_and"])
					) {
						$useDevices = false;
					}

				}
			}
			if(!$notificationPreference["dont_use_keywords"]){
				$keywords = explode(",",$notificationPreference["keywords"]);
				$keywords[] = $user->getUsername();
				$present = false;
				foreach($keywords as $keyword){
					$keyword = trim($keyword);
					$keyword = " ".$keyword." ";
					if(strrpos(strtolower($title." ".$text." "), strtolower($keyword))>=0) {
						$present = true;
					}
				}
				if(!$present){
					continue;
				}
			}
			if($notificationPreference["privacy"]){
				$data["text"] = "[Private]";
			}

			$n = new Notification($application, $workspace, $user);
			if($data){
				$n->setData($data);
			}
			if($code){
				$n->setCode($code);
			}
			if($text){
				$n->setText($text);
			}
			if($title){
				$n->setTitle($title);
			}
			$this->doctrine->persist($n);

			if(in_array("push", $type)){
				$totalNotifications = $this->countAll($user) + 1;
				if($useDevices) {
					@$this->pushDevice($user, $data["text"], $title, $totalNotifications, $data);
				}else{
					@$this->updateDeviceBadge($user, $totalNotifications);
				}
			}
			if(in_array("mail", $type)){
				@$this->sendMail($application, $workspace, $user, $text);
			}

			$data["action"] = "add";
			$this->pusher->push($data, "notifications/".$user->getId());



		}

		$this->doctrine->flush();



    }

	public function readAll($application, $workspace, $user, $code = null, $force=false)
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

        $count = count($notif);
        for($i = 0; $i < $count; $i++) {
			$this->doctrine->remove($notif[$i]);

		}

        if($count>0 || $force) {
            $this->doctrine->flush();

            $totalNotifications = $this->countAll($user);

            $data = Array(
                "action"=>"remove",
                "workspace_id"=>($workspace)?$workspace->getId():null,
                "app_id"=>($application)?$application->getId():null
            );
    		$this->pusher->push($data, "notifications/".$user->getId());

            $this->updateDeviceBadge($user, $totalNotifications);
        }



    }

	public function countAll($user)
	{
		$qb = $this->doctrine->createQueryBuilder();
		$qb = $qb->select('count(n.id)')
			->where('n.user = :user')
			->setParameter('user', $user)
			->from('TwakeNotificationsBundle:Notification','n');

		return $qb->getQuery()->getSingleScalarResult();
	}

	public function getAll($user)
	{
		$nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
		$notifs = $nRepo->findBy(Array("user"=>$user), Array("id" => "DESC"), 30); //Limit number of results

		return $notifs;
	}


	/* Private */
	private function updateDeviceBadge($user, $badge=0){
		$devicesRepo = $this->doctrine->getRepository("TwakeUsersBundle:Device");
		$devices = $devicesRepo->findBy(Array("user"=>$user));

        $count = count($devices);
        for($i = 0; $i < $count; $i++) {
            $device = $devices[$i];

            $token = $device->getValue();

            $this->pushDeviceInternal($device->getType(), $token,
                null,
                null,
                $badge,
                null
            );


		}
	}

	private function pushDevice($user, $text, $title, $badge=null, $data=null){

		$devicesRepo = $this->doctrine->getRepository("TwakeUsersBundle:Device");
		$devices = $devicesRepo->findBy(Array("user"=>$user));

        $count = count($devices);
        for($i = 0; $i < $count; $i++) {
            $device = $devices[$i];

            $token = $device->getValue();

            $this->pushDeviceInternal($device->getType(), $token,
                substr($text, 0, 100),
                substr($title, 0, 50),
                $badge,
                $data
            );


		}
	}

	private function pushDeviceInternal($type, $deviceId, $message, $title, $badge, $data){

        $data = Array(
            "message" => $message,
            "title" => $title,
            "data" => $data,
            "badge" => $badge,
            "device_id" => $deviceId
        );
        try {
            if ($type == "FCM") {
                $data["type"] = "fcm";
                $this->circle->post($this->pushNotificationServer, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 1));
            }
            if ($type == "APNS") {
                $data["type"] = "apns";
                $this->circle->post($this->pushNotificationServer, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 1));
            }
        } catch (\Exception $exception) {
            error_log("ERROR");
        }
    }

	private function sendMail($application, $workspace, $user, $text){
		$this->mailer->send($user->getEmail(), "notification", Array(
			"application_name"=>($application)?$application->getName():"Twake",
			"workspace_name"=>($workspace)?$workspace->getName():"Account",
			"username"=>$user->getUsername(),
			"text"=>$text
		));
	}
}
