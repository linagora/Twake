<?php


namespace WebsiteApi\NotificationsBundle\Services;
use phpDocumentor\Reflection\Types\Array_;
use RMS\PushNotificationsBundle\Message\iOSMessage;
use WebsiteApi\NotificationsBundle\Entity\Notification;
use WebsiteApi\NotificationsBundle\Model\NotificationsInterface;
use WebsiteApi\NotificationsBundle\Entity\PushNotificationQueue;
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
    var $standalone;
    var $licenceKey;

    public function __construct($doctrine, $pusher, $mailer, $circle, $pushNotificationServer, $standalone, $licenceKey)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->mailer = $mailer;
        $this->circle = $circle;
        $this->pushNotificationServer = $pushNotificationServer;
        $this->standalone = $standalone;
        $this->licenceKey = $licenceKey;
    }

    public function pushNotification($application = null, $workspace = null, $users = null, $levels = null, $code = null, $text = null, $type = Array(), $_data = null, $save_notification = true)
    {

        if($workspace != null){
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }

        if($application != null) {
            $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($application);
        }

        $title = "";
        if ($workspace && $workspace->getGroup() && !$workspace->getUser()) {
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

        $toPush = true;

        $count = count($users);
        for($i = 0; $i < $count; $i++) {

            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($users[$i]);

            //Verify that user want this notification

            $notificationPreference = $user->getNotificationPreference();
            $useDevices = false;
            if( $data["workspace_id"] != null){
                $workspace_id = $data["workspace_id"];
                $disabled_workspaces = $notificationPreference["disabled_workspaces"];
                if (in_array($workspace_id,$disabled_workspaces)){
                    return false;
                }
                if($application!=null){
                    if(isset($notificationPreference["workspace"][$workspace_id])){
                        if(isset($notificationPreference["workspace"][$workspace_id][$application->getId()])){
                            $toPush = false;
                        }
                    }
                }
            }
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
            if ($_data) {
                $n->setData($_data);
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

            if ($save_notification) {
                $this->doctrine->persist($n);
            }

            if(in_array("push", $type) && $toPush){
                $totalNotifications = $this->countAll($user) + 1;
                if($useDevices) {
                    @$this->pushDevice($user, $data["text"], $title, $totalNotifications, $_data);
                }else{
                    @$this->updateDeviceBadge($user, $totalNotifications);
                }
            }
            if(in_array("mail", $type)){
                @$this->sendMail($application, $workspace, $user, $text);
            }

            $data = $n->getAsArray();
            $data["action"] = "add";
            if($toPush)
                $this->pusher->push($data, "notifications/".$user->getId());



        }

        $this->doctrine->flush();



    }
    public function deleteAll($application, $workspace, $user, $code = null, $force=false)
    {

        $nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");

        $search = Array(
            "user" => $user
        );

        if ($code) {
            $search["code"] = $code;
        }

        if ($application) {
            $search["application"] = $application;
        }

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $notif = $nRepo->findBy($search);

        $count = count($notif);
        for($i = 0; $i < $count; $i++) {
            $this->doctrine->remove($notif[$i]);
        }

        if ($count == 0){
            return false;
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
            return true;
        }
        return true;


    }

    public function readAll($application, $workspace, $user, $code = null, $force=false)
    {

        $this->deleteAll($application, $workspace, $user, $code, $force);
        return;

        $nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");

        $search = Array(
            "user" => $user
        );

        if ($code) {
            $search["code"] = $code;
        }

        if ($application) {
            $search["application"] = $application;
        }

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $search["isRead"] = false;

        $notif = $nRepo->findBy($search);

        $count = count($notif);
        for($i = 0; $i < $count; $i++) {
            $notif[$i]->setIsRead(true);
            $this->doctrine->persist($notif[$i]);
        }

        if ($count == 0){
            return false;
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
            return true;
        }
        return true;


    }

    public function countAll($user)
    {
        $qb = $this->doctrine->createQueryBuilder();
        $qb = $qb->select('count(n.id)')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
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


    public function pushDeviceInternal($type, $deviceId, $message, $title, $badge, $_data)
    {

        if (strlen($deviceId) < 32) { //False device
            return;
        }

        $data = Array(
            "message" => $message,
            "title" => $title,
            "data" => $_data,
            "badge" => $badge,
            "device_id" => $deviceId,
            "type" => $type
        );
        try {
            $element = new PushNotificationQueue($data);
            $this->doctrine->persist($element);
            $this->doctrine->flush();
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

    public function deleteAllExceptMessages($user,$force=false){

        $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(array("publicKey" => "messages"));

        $nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
        $notif = $nRepo->getAppNoMessages($app);
        $count = count($notif);


        if ($count == 0){
            return false;
        }
        for($i = 0; $i < $count; $i++) {
            $this->doctrine->remove($notif[$i]);

        }

        if($count>0 || $force) {
            $this->doctrine->flush();

            $totalNotifications = $this->countAll($user);

            $data = Array(
                "action" => "remove_all_non_messages"
            );
            //convert
            $this->pusher->push($data, "notifications/".$user->getId());

            $this->updateDeviceBadge($user, $totalNotifications);
            return true;
        }

        return true;
    }
    public function readAllExceptMessages($user,$force=false){

        $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(array("publicKey" => "messages"));

        $nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
        $notif = $nRepo->getAppNoMessages($app);
        $count = count($notif);


        if ($count == 0){
            return false;
        }
        for($i = 0; $i < $count; $i++) {
            $notif[$i]->setIsRead(true);
            $this->doctrine->persist($notif[$i]);

        }

        if($count>0 || $force) {
            $this->doctrine->flush();

            $totalNotifications = $this->countAll($user);

            $data = Array(
                "action" => "remove_all_non_messages"
            );
            //convert
            $this->pusher->push($data, "notifications/".$user->getId());

            $this->updateDeviceBadge($user, $totalNotifications);
            return true;
        }

        return true;
    }

}
