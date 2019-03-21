<?php


namespace WebsiteApi\NotificationsBundle\Services;

use Emojione\Client;
use Emojione\Emojione;
use Emojione\Ruleset;
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
        $this->emojione_client = new Client(new Ruleset());
    }

    /**
     * @param null $application Application where the notification is from "null" = messaging service
     * @param null $sender_application Application generating the notification
     * @param null $sender_user User generating the notification
     * @param null $workspace Workspace where the notification can be found
     * @param null $channel Channel where the notification can be found
     * @param null $users List of users which receive the notification
     * @param null $code Identifier for the notification (mass deletion)
     * @param null $text Text for the notification
     * @param null $shortcut String to find precisely notification origin
     * @param null $additionnal_data
     * @param array $type Types of notification : "push" and "mail"
     * @param bool $save_notification Add notification to log or not (default true)
     */
    public function pushNotification(
        $application = null,
        $sender_application = null,
        $sender_user = null,
        $workspace = null,
        $channel = null,
        $users = null,
        $code = null,
        $text = null,
        $shortcut = null,
        $additionnal_data = Array(),
        $type = Array(),
        $save_notification = true
    )
    {

        //Construct title and text according with metadata
        if ($sender_user) {
            $title = $sender_user->getFullName();
        } else if ($sender_application) {
            $title = $sender_application->getName();
        } else if ($application) {
            $title = $application->getName();
        } else {
            $title = "Notification";
        }
        if ($channel && !$channel->getDirect()) {
            $title .= " to ";
            if ($channel->getIcon()) {
                $title .= $channel->getIcon() . " ";
            }
            $title .= $channel->getName();
        }
        if ($workspace) {
            $title .= " in " . $workspace->getName() . " (" . $workspace->getGroup()->getName() . ")";
        }

        if (($application || $sender_application) && $sender_user) {
            if ($application) {
                $text = $application->getName() . " : " . $text;
            } else {
                $text = $sender_application->getName() . " : " . $text;
            }
        }
        //End title and text construction

        $data = Array(
            "type"=>"add",
            "application_id" => ($application != null ? $application->getId() : null),
            "sender_application_id" => ($sender_application != null ? $sender_application->getId() : null),
            "sender_user_id" => ($sender_user != null ? $sender_user->getId() : null),
            "workspace_id"=>($workspace!=null?$workspace->getId():null),
            "channel_id" => ($channel != null ? $channel->getId() : null),
            "title" => $title,
            "text" => $text,
            "code" => $code,
            "type" => $type,
            "shortcut" => $shortcut,
            "additionnal_data" => $additionnal_data
        );

        $device_minimal_data = Array(
            "shortcut" => $shortcut,
            "workspace_id" => ($workspace != null ? $workspace->getId() : null),
            "channel_id" => ($channel != null ? $channel->getId() : null)
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
                if (in_array($workspace_id . "", $disabled_workspaces)) {
                    return false;
                }
                if($application!=null){
                    if (isset($notificationPreference["workspace"][$workspace_id . ""])) {
                        if (isset($notificationPreference["workspace"][$workspace_id . ""][$application->getId() . ""])) {
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
            if ($shortcut) {
                $n->setShortcut($shortcut);
            }
            if ($additionnal_data) {
                $n->setData($additionnal_data);
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
                    @$this->pushDevice($user, $data["text"], $title, $totalNotifications, $device_minimal_data, false);
                }else{
                    @$this->updateDeviceBadge($user, $totalNotifications, Array(), false);
                }

            }
            if(in_array("mail", $type)){
                @$this->sendMail($application, $workspace, $user, $text);
            }

            $data = $n->getAsArray();
            $data["action"] = "add";
            if ($toPush) {
                $this->pusher->push("notifications/" . $user->getId(), $data);
            }

        }

        $this->doctrine->flush();

    }

    public function deleteAll($application, $workspace, $user, $code = null, $force=false)
    {

        //TODO
        /*
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
        */

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

        $search["isread"] = false;

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

        return 0;

        //TODO
        /*$nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
        $notifs = $nRepo->findBy(Array("user" => $user, "isread" => false), Array("id" => "DESC"), 30); //Limit number of results

        return count($notifs);*/
    }

    public function getAll($user)
    {
        $nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");
        $notifs = $nRepo->findBy(Array("user"=>$user), Array("id" => "DESC"), 30); //Limit number of results

        return $notifs;
    }


    /* Private */
    private function updateDeviceBadge($user, $badge = 0, $data = null, $doPush = true)
    {
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
                $data,
                $doPush
            );


        }
    }

    private function pushDevice($user, $text, $title, $badge = null, $data = null, $doPush = true)
    {

        $devicesRepo = $this->doctrine->getRepository("TwakeUsersBundle:Device");
        $devices = $devicesRepo->findBy(Array("user"=>$user));

        $title = html_entity_decode($this->emojione_client->shortnameToUnicode($title), ENT_NOQUOTES, 'UTF-8');
        $text = html_entity_decode($this->emojione_client->shortnameToUnicode($text), ENT_NOQUOTES, 'UTF-8');

        $count = count($devices);
        for($i = 0; $i < $count; $i++) {
            $device = $devices[$i];

            $token = $device->getValue();

            $this->pushDeviceInternal($device->getType(), $token,
                substr($text, 0, 100) . (strlen($title) > 100 ? "..." : ""),
                substr($title, 0, 50) . (strlen($title) > 50 ? "..." : ""),
                $badge,
                $data,
                $doPush
            );


        }
    }

    public function pushDeviceInternal($type, $deviceId, $message, $title, $badge, $_data, $doPush = true)
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
            if ($doPush) {
                $this->doctrine->flush();
            }
        } catch (\Exception $exception) {
            error_log("ERROR in pushDeviceInternal");
        }
    }

    private function sendMail($application, $workspace, $user, $text){

        $text = html_entity_decode($this->emojione_client->shortnameToUnicode($text), ENT_NOQUOTES, 'UTF-8');

        $this->mailer->send($user->getEmail(), "notification", Array(
            "_language" => $user ? $user->getLanguage() : "en",
            "application_name"=>($application)?$application->getName():"Twake",
            "workspace_name"=>($workspace)?$workspace->getName():"Account",
            "username"=>$user->getUsername(),
            "text"=>$text
        ));
    }

    public function deleteAllExceptMessages($user, $force=false){

        return true;

        //TODO
        /*
                $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(array("simple_name" => "messages"));

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

                    $data = Array(
                        "action" => "remove_all_non_messages"
                    );
                    //convert
                    $this->pusher->push($data, "notifications/".$user->getId());

                    $totalNotifications = $this->countAll($user);
                    $this->updateDeviceBadge($user, $totalNotifications);
                    return true;
                }

                return true;*/
    }

    public function readAllExceptMessages($user, $force = false)
    {

        return true;

        //TODO
        /*

        $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(array("simple_name" => "messages"));

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
        */
    }

}
