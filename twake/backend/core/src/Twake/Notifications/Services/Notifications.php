<?php


namespace Twake\Notifications\Services;

use App\App;
use Emojione\Client;
use Emojione\Ruleset;
use Twake\Core\Services\DoctrineAdapter\ManagerAdapter;
use Twake\Core\Services\Queues\Adapters\QueueManager;
use Twake\Core\Services\Queues\Scheduled;
use Twake\Notifications\Entity\MailNotificationQueue;
use Twake\Notifications\Entity\Notification;
use Twake\Notifications\Entity\PushNotificationQueue;
use Twake\Notifications\Model\NotificationsInterface;
use Twake\Users\Entity\User;

/**
 * Class Notifications
 * @package Twake\Users\Services
 *
 * Gestion des notifications
 */
class Notifications
{

    /** @var ManagerAdapter */
    var $doctrine;
    var $circle;
    var $pushNotificationServer;
    var $standalone;
    var $licenceKey;
    /** @var QueueManager */
    var $queues;
    /** @var Scheduled */
    var $scheduled_queues;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->queues = $app->getServices()->get("app.queues")->getAdapter();
        $this->scheduled_queues = $app->getServices()->get("app.queues_scheduled");
        $this->pusher = $app->getServices()->get("app.websockets");
        $this->mailer = $app->getServices()->get("app.twake_mailer");
        $this->circle = $app->getServices()->get("app.restclient");
        $this->pushNotificationServer = $app->getContainer()->getParameter("PUSH_NOTIFICATION_SERVER");
        $this->standalone = $app->getContainer()->getParameter("env.standalone");
        $this->licenceKey = $app->getContainer()->getParameter("env.licence_key");
        $this->emojione_client = new Client(new Ruleset());
    }

    // Collections part
    public function init($route, $data, $current_user = null)
    {
        if (!is_string($current_user) && $current_user && explode("/", $route)[1] == $current_user->getId()) {
            return true;
        }
        return false;
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
        $message = null,
        $additionnal_data = Array(),
        $type = Array(),
        $save_notification = true
    )
    {
        $message_id = $message ? $message->getId() : "";

        $text = trim($text);
        $text = preg_replace("/ +/", " ", $text);

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
            "type" => "add",
            "application_id" => ($application != null ? $application->getId() : null),
            "sender_application_id" => ($sender_application != null ? $sender_application->getId() : null),
            "sender_user_id" => ($sender_user != null ? $sender_user->getId() : null),

            "company_id" => ($workspace != null ? $workspace->getGroup()->getId() : null),
            "workspace_id" => ($workspace != null ? $workspace->getId() : null),
            "channel_id" => ($channel != null ? $channel->getId() : null),
            "message_id" => $message_id,
            "thread_id" => $message ? $message->getParentMessageId() : "",
            
            "title" => $title,
            "original_text" => $text,
            "text" => $text,
            "code" => $code,
            "type" => $type,
            "shortcut" => $message_id,
            "additionnal_data" => $additionnal_data
        );

        $device_minimal_data = Array(
            "shortcut" => $message_id,
            "company_id" => ($workspace != null ? $workspace->getGroup()->getId() : null),
            "workspace_id" => ($workspace != null ? $workspace->getId() : null),
            "channel_id" => ($channel != null ? $channel->getId() : null),
            "message_id" => $message_id,
            "thread_id" => $message ? $message->getParentMessageId() : "",
            "click_action" => "FLUTTER_NOTIFICATION_CLICK",
        );

        $toPush = true;

        $count = count($users);
        for ($i = 0; $i < $count; $i++) {

            $data["text"] = $data["original_text"];

            $user = $this->doctrine->getRepository("Twake\Users:User")->find($users[$i]);

            if (!$user) {
                continue;
            }

            //Verify that user want this notification

            $notificationPreference = $user->getNotificationPreference();

            $notification_disabled = false;
            if ($notificationPreference["disable_until"] > 0) {
                $delta = $notificationPreference["disable_until"] - time();
                if ($delta > 0) {
                    $notification_disabled = true;
                }
            }

            $mail_preferences = isset($notificationPreference["mail_notifications"]) ? $notificationPreference["mail_notifications"] : 2;

            $useDevices = false;
            if ($data["workspace_id"] != null) {
                $workspace_id = $data["workspace_id"];
                $disabled_workspaces = $notificationPreference["disabled_workspaces"];
                if (in_array($workspace_id . "", $disabled_workspaces)) {
                    return false;
                }
                if ($application != null) {
                    if (isset($notificationPreference["workspace"][$workspace_id . ""])) {
                        if (isset($notificationPreference["workspace"][$workspace_id . ""][$application->getId() . ""])) {
                            $toPush = false;
                        }
                    }
                }
            }
            if ($notificationPreference["devices"] == 0) {
                $useDevices = true;
            }
            if ($notificationPreference["devices"] == 1 && !$user->isConnected()) {
                $useDevices = true;
            }
            if ($useDevices) {
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
            if (!$notificationPreference["dont_use_keywords"]) {
                $keywords = explode(",", $notificationPreference["keywords"]);
                $keywords[] = $user->getUsername();
                $present = false;
                foreach ($keywords as $keyword) {
                    $keyword = trim($keyword);
                    $keyword = " " . $keyword . " ";
                    if (mb_strrpos(mb_strtolower($title . " " . $text . " "), mb_strtolower($keyword)) >= 0) {
                        $present = true;
                    }
                }
                if (!$present) {
                    continue;
                }
            }
            if ($notificationPreference["privacy"]) {
                $data["text"] = "[Private]";
            }

            $n = new Notification($application ? $application->getId() : "", $workspace ? $workspace->getId() : "", $channel ? $channel->getId() : "", $user);
            if ($message_id) {
                $n->setShortcut($message_id);
            }
            if ($additionnal_data) {
                $n->setData($additionnal_data);
            }
            if ($code) {
                $n->setCode($code);
            }
            if ($text) {
                $n->setText($text);
            }
            if ($title) {
                $n->setTitle($title);
            }

            if ($save_notification) {
                $this->doctrine->persist($n);

                if ($mail_preferences == 2 || $mail_preferences == 1) {
                    $this->addMailReminder($user);
                }

            }

            if (in_array("push", $type) && $toPush && !$notification_disabled) {

                $totalNotifications = 1;
                if ($useDevices) {
                    @$this->pushDevice($user, $data["text"], $title, $totalNotifications, $device_minimal_data, false);
                } else {
                    @$this->updateDeviceBadge($user, $totalNotifications, Array(), false);
                }

            }
            if (in_array("mail", $type)) {
                @$this->sendMail($application, $workspace, $user, $text);
            }

            if ($toPush && !$notification_disabled) {
                $ws_data = Array(
                    "client_id" => "system",
                    "action" => "save",
                    "object_type" => "",
                    "object" => $n->getAsArray()
                );
                $this->pusher->push("notifications/" . $user->getId(), $ws_data);
            }

        }

        $this->doctrine->flush();

    }

    public function pushDevice($user, $text, $title, $badge = null, $data = null, $doPush = true)
    {

        $devicesRepo = $this->doctrine->getRepository("Twake\Users:Device");
        $devices = $devicesRepo->findBy(Array("user_id" => $user->getId()));

        $title = html_entity_decode($this->emojione_client->shortnameToUnicode($title), ENT_NOQUOTES, 'UTF-8');
        $text = html_entity_decode($this->emojione_client->shortnameToUnicode($text), ENT_NOQUOTES, 'UTF-8');

        $count = count($devices);
        for ($i = 0; $i < $count; $i++) {
            $device = $devices[$i];

            $token = $device->getValue();

            $this->pushDeviceInternal($device->getType(), $token,
                mb_substr($text, 0, 100) . (mb_strlen($title) > 100 ? "..." : ""),
                mb_substr($title, 0, 50) . (mb_strlen($title) > 50 ? "..." : ""),
                $badge,
                $data,
                $doPush
            );


        }
    }

    public function pushDeviceInternal($type, $deviceId, $message, $title, $badge, $_data, $doPush = true)
    {

        if (mb_strlen($deviceId) < 32) { //False device
            return;
        }

        $data = Array(
            "message" => $message,
            "title" => $title,
            "data" => json_encode($_data),
            "badge" => $badge,
            "device_id" => $deviceId,
            "type" => $type
        );

        $this->queues->push("push_notification", $data);
    }

    public function updateDeviceBadge($user, $badge = 0, $data = null, $doPush = true)
    {

        $devicesRepo = $this->doctrine->getRepository("Twake\Users:Device");
        $devices = $devicesRepo->findBy(Array("user_id" => $user));

        $count = count($devices);
        for ($i = 0; $i < $count; $i++) {
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


    /* Private */

    public function sendMail($application, $workspace, $user, $text)
    {

        $text = html_entity_decode($this->emojione_client->shortnameToUnicode($text), ENT_NOQUOTES, 'UTF-8');

        $this->mailer->send($user->getEmail(), "notification", Array(
            "_language" => $user ? $user->getLanguage() : "en",
            "application_name" => ($application) ? $application->getName() : "Twake",
            "workspace_name" => ($workspace) ? $workspace->getName() : "Account",
            "username" => $user->getUsername(),
            "text" => $text
        ));
    }

    public function deleteAll($application, $workspace, $user, $code = null, $force = false)
    {

        //TODO
        /*
        $nRepo = $this->doctrine->getRepository("Twake\Notifications:Notification");

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

    public function readAll($user)
    {

        $this->removeMailReminder($user);

        $has_notification_group = false;
        $has_notification_workspace = false;

        $group_members = $this->doctrine->getRepository("Twake\Workspaces:GroupUser")->findBy(Array("user" => $user));
        foreach ($group_members as $group_member) {
            if ($group_member->getHasNotifications()) {
                $has_notification_group = true;
                $group_member->setHasNotifications(false);
                $this->doctrine->persist($group_member);
            }
        }
        $this->doctrine->flush();

        if ($has_notification_group) {

            $workspace_members = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findBy(Array("user_id" => $user->getId()));
            foreach ($workspace_members as $workspace_member) {
                if ($workspace_member->getHasNotifications()) {
                    $has_notification_workspace = true;
                    $workspace_member->setHasNotifications(false);
                    $this->doctrine->persist($workspace_member);
                }
            }
            $this->doctrine->flush();

        }

        $channel_members = $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findBy(Array("direct" => true, "user_id" => $user->getId()));
        if ($has_notification_workspace) {
            $channel_members = array_merge($channel_members, $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findBy(Array("direct" => false, "user_id" => $user->getId())));
        }
        foreach ($channel_members as $channel_member) {

            $channel = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel_member->getChannelId()));
            if (!$channel) {
                $this->doctrine->remove($channel_member);
            }
            if ($channel && $channel->getMessagesIncrement() != $channel_member->getLastMessagesIncrement()) {
                $channel_member->setLastMessagesIncrement($channel->getMessagesIncrement());
                $this->doctrine->persist($channel_member);
            }
        }
        $this->doctrine->flush();

    }

    /**
     * @param $user User
     */
    public function removeMailReminder($user)
    {
        if (!$user) {
            return;
        }

        $user_notification_status = $this->doctrine->getRepository("Twake\Notifications:UserNotificationStatus")->findOneBy(Array("user_id" => $user->getId()));
        if ($user_notification_status) {
            $user_notification_status->setMailStatus(0);
            $this->doctrine->persist($user_notification_status);
        }

        $user->setNotificationReadIncrement($user->getNotificationWriteIncrement());
        $this->doctrine->persist($user);

        $repo = $this->doctrine->getRepository("Twake\Notifications:MailNotificationQueue");
        $reminder = $repo->findOneBy(Array("user_id" => $user->getId()));
        if ($reminder) {
            $this->doctrine->remove($reminder);
            $this->doctrine->flush();
        }

    }

    /**
     * @param $user User
     */
    private function addMailReminder($user)
    {

        $user->setNotificationWriteIncrement($user->getNotificationWriteIncrement() + 1);
        $this->doctrine->persist($user);

        $repo = $this->doctrine->getRepository("Twake\Notifications:MailNotificationQueue");
        $reminder = $repo->findOneBy(Array("user_id" => $user->getId()));
        if (!$reminder) {
            $token = base64_encode(bin2hex(random_bytes(32)));

            $reminder = new MailNotificationQueue($user->getId());
            $reminder->setToken($token);
            $this->doctrine->useTTLOnFirstInsert(60 * 60 * 24);
            $this->doctrine->persist($reminder);

            $this->scheduled_queues->schedule("mail_reminder", date("U") + 60 * 60 * 12, [
                "token" => $token,
                "user_id" => $user->getId(),
                "id" => $reminder->getId()
            ]);

        }

        $this->doctrine->flush();

    }

    public function get($options, $current_user)
    {
        return $this->getAll($current_user);
    }

    public function getAll($user)
    {
        $nRepo = $this->doctrine->getRepository("Twake\Notifications:Notification");
        $notifs = $nRepo->findBy(Array("user" => $user), Array(), 30); //Limit number of results

        return $notifs;
    }

    public function sendCustomMail($mail, $template, $data = Array(), $files = Array())
    {
        $this->mailer->send($mail, $template, $data, $files);
    }

    public function deleteAllExceptMessages($user, $force = false)
    {

        return true;

        //TODO
        /*
                $app = $this->doctrine->getRepository("Twake\Market:Application")->findOneBy(array("simple_name" => "messages"));

                $nRepo = $this->doctrine->getRepository("Twake\Notifications:Notification");
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

        $app = $this->doctrine->getRepository("Twake\Market:Application")->findOneBy(array("simple_name" => "messages"));

        $nRepo = $this->doctrine->getRepository("Twake\Notifications:Notification");
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
