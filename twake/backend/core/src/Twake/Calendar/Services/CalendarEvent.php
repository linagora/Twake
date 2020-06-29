<?php

namespace Twake\Calendar\Services;

use App\App;
use Twake\Calendar\Entity\Event;
use Twake\Calendar\Entity\EventCalendar;
use Twake\Calendar\Entity\EventNotification;
use Twake\Calendar\Entity\EventUser;
use Twake\Core\CommonObjects\AttachementManager;
use Twake\Core\Services\Queues\Scheduled;

class CalendarEvent
{

    /** @var Scheduled */
    var $queues_scheduled;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->calendarExport = $app->getServices()->get("app.calendar.export");
        $this->enc_pusher = $app->getServices()->get("app.websockets");
        $this->applications_api = $app->getServices()->get("app.applications_api");
        $this->notifications = $app->getServices()->get("app.notifications");
        $this->queues_scheduled = $app->getServices()->get("app.queues_scheduled");
        $this->attachementManager = new AttachementManager($this->doctrine, $this->enc_pusher);
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        return $this->hasAccess($data, $current_user);
    }

    public function hasAccess($data, $current_user = null)
    {
        //TODO

        if ($data["entity"]) {
            //Test we have access to this event
        }

        return true;
    }

    public function get($options, $current_user)
    {

        $after_ts = floor(($options["after_ts"] ? $options["after_ts"] : 0) / (60 * 60 * 24 * 7));
        $before_ts = floor(($options["before_ts"] ? $options["before_ts"] : 0) / (60 * 60 * 24 * 7));
        $mode = $options["mode"]; //User or workspace

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $events_ids = [];
        if ($mode == "workspace" || $mode == "both") {


            $events_links = [];
            foreach (($options["calendar_list"] ? $options["calendar_list"] : []) as $object) {
                $workspace_id = $object["workspace_id"];
                $calendar_id = $object["calendar_id"];
                if ($calendar_id && $workspace_id) {
                    $events_links = array_merge($events_links, $this->doctrine->getRepository("Twake\Calendar:EventCalendar")->findRange(Array("workspace_id" => $workspace_id, "calendar_id" => $calendar_id), false, "sort_date", $after_ts, $before_ts));
                }
            }

            foreach ($events_links as $event_link) {
                $events_ids[] = $event_link->getEventId();
            }

        }
        if ($mode == "mine" || $mode == "both") {

            if (!isset($options["users_ids_or_mails"]) && $current_user) {
                $options["users_ids_or_mails"] = [$current_user->getId()];
            }

            $events_links = [];
            foreach (($options["users_ids_or_mails"] ? $options["users_ids_or_mails"] : []) as $user_id_or_mail) {
                $events_links = array_merge($events_links, $this->doctrine->getRepository("Twake\Calendar:EventUser")->findRange(Array("user_id_or_mail" => $user_id_or_mail), false, "sort_date", $after_ts, $before_ts));
            }

            foreach ($events_links as $event_link) {
                $events_ids[] = $event_link->getEventId();
            }

        }

        $events_ids = array_unique($events_ids);

        $ret = [];
        foreach ($events_ids as $id) {
            $event = $this->doctrine->getRepository("Twake\Calendar:Event")->find($id);
            if ($event) {
                $ret[] = $event->getAsArray();
            } else {
                //Remove innexistant event
                $this->removeEventDependancesById($id);
            }
        }

        return $ret;
    }

    private function removeEventDependancesById($id)
    {
        $event = $this->doctrine->getRepository("Twake\Calendar:Event")->findOneBy(Array("id" => $id));
        if ($event) {
            $this->attachementManager->removeAttachementsFromEntity($event);
        }

        $entities = $this->doctrine->getRepository("Twake\Calendar:EventCalendar")->findBy(Array("event_id" => $id));
        $entities = array_merge($entities, $this->doctrine->getRepository("Twake\Calendar:EventUser")->findBy(Array("event_id" => $id)));
        foreach ($entities as $entity) {
            $this->doctrine->remove($entity);

        }
        $this->doctrine->flush();
    }

    public function remove($object, $options, $current_user = null)
    {
        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $event = $this->doctrine->getRepository("Twake\Calendar:Event")->find($id);
        if (!$event) {
            return false;
        }

        $participants = $event->getParticipants();

        //Quit event
        if ($event->getOwner() && $event->getOwner() != $current_user->getId()) {
            $list = [];
            foreach ($event->getParticipants() as $part) {
                if ($part["user_id_or_mail"] != $current_user->getId()) {
                    $list[] = $part;
                }
            }
            $this->updateParticipants($event, $list, false);

            $evt = Array(
                "client_id" => "system",
                "action" => "save",
                "object_type" => "",
                "object" => $event->getAsArray()
            );

        } //Or delete event
        else {
            $this->doctrine->remove($event);
            $this->doctrine->flush();

            $this->removeEventDependancesById($id);

            //Notify connectors
            $resources = [];
            $done = [];
            foreach ($event->getWorkspacesCalendars() as $calendar) {
                $workspace_id = $calendar["workspace_id"];
                if (!in_array($workspace_id, $done)) {
                    $done[] = $workspace_id;
                    $resources = array_merge($resources, $this->applications_api->getResources($workspace_id, "workspace_calendar", $workspace_id));
                }
            }
            $apps_ids = [];
            foreach ($resources as $resource) {
                if (in_array("event", $resource->getApplicationHooks())) {
                    $apps_ids[] = $resource->getApplicationId();
                }
            }
            if (count($apps_ids) > 0) {
                foreach ($apps_ids as $app_id) {
                    if ($app_id) {
                        $data = Array(
                            "event" => $event->getAsArray()
                        );
                        $this->applications_api->notifyApp($app_id, "hook", "remove_event", $data);
                    }
                }
            }

            $evt = Array(
                "client_id" => "system",
                "action" => "remove",
                "object_type" => "",
                "front_id" => $event->getFrontId()
            );
        }

        //Notify modification for participant users
        foreach ($participants as $participant) {
            if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                $this->enc_pusher->push("calendar_events/user/" . $participant["user_id_or_mail"], $evt);
            }
        }

        return $event->getAsArray();
    }

    public function updateParticipants(Event $event, $participants = Array(), $replace_all = false)
    {
        $sort_key = $event->getSortKey();

        $participants = $participants ? $participants : [];

        $updated_participants = $this->formatArrayInput($participants, ["user_id_or_mail"]);
        $current_participants = $event->getParticipants();
        $updated_participants_fixed = $current_participants;

        $get_diff = $this->getArrayDiffUsingKeys($updated_participants, $current_participants, ["user_id_or_mail"]);
        error_log("get diff" . json_encode($get_diff));
        if (count($get_diff["del"]) > 0 || $replace_all) {
            $users_in_event = $this->doctrine->getRepository("Twake\Calendar:EventUser")->findBy(Array("event_id" => $event->getId()));
            foreach ($users_in_event as $user) {
                if ($this->inArrayUsingKeys($get_diff["del"], Array("user_id_or_mail" => $user->getUserIdOrMail()), ["user_id_or_mail"]) || $replace_all) {
                    //Remove old participants
                    $this->doctrine->remove($user);

                    //Remove from array fixed
                    foreach ($updated_participants_fixed as $i => $v) {
                        if ($v["user_id_or_mail"] == $user->getUserIdOrMail()) {
                            unset($updated_participants_fixed[$i]);
                        }
                    }

                }
            }
        }

        foreach (($replace_all ? $updated_participants : $get_diff["add"]) as $participant) {
            foreach ($sort_key as $sort_date) {

                $fixed_participant = $participant;

                //Remove from array fixed
                if (filter_var($participant["user_id_or_mail"], FILTER_VALIDATE_EMAIL)) {
                    //Mail given
                    $mail = trim(strtolower($participant["user_id_or_mail"]));
                    $mail_entity = $this->doctrine->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => $mail));
                    if ($mail_entity) {
                        $fixed_participant["user_id_or_mail"] = $mail_entity->getUser()->getId();
                    }
                } else if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                    //User id given
                    $user = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
                    if (!$user) {
                        continue;
                    }
                    $mail = $user->getEmail();
                } else {
                    continue;
                }

                $fixed_participant["email"] = $mail;
                $participant = $fixed_participant;

                $user = new EventUser($participant["user_id_or_mail"], $event->getId(), $sort_date);
                $user->setEmail($mail);
                $this->doctrine->persist($user);

                $updated_participants_fixed[] = $participant;

            }
        }

        $_updated_participants_fixed = [];
        foreach ($updated_participants_fixed as $v) {
            $_updated_participants_fixed[] = $v;
        }
        $updated_participants_fixed = $_updated_participants_fixed;
        $event->setParticipants($updated_participants_fixed);
        $this->doctrine->persist($event);

        $this->doctrine->flush();
    }

    //TODO Not the best to send update email every time, change it to a worker waiting 30 minutes at least

    public function formatArrayInput($array, $id_keys = [])
    {
        $updated_array = [];
        $unicity = [];
        foreach ($array as $element) {

            $tmp = false;

            if (is_array($element)) {
                $all_ok = true;
                foreach ($id_keys as $id_key) {
                    if (!isset($element[$id_key])) {
                        $all_ok = false;
                    }
                }
                if ($all_ok) {
                    $tmp = $element;
                }
            } else {
                $tmp = Array();
                $tmp[$id_key] = $element;
            }

            if ($tmp !== false) {
                $uniq_key = "";
                foreach ($id_keys as $id_key) {
                    $uniq_key .= "_" . $tmp[$id_key];
                }
                if (!in_array($uniq_key, $unicity)) {
                    $unicity[] = $uniq_key;
                    $updated_array[] = $tmp;
                }
            }

        }
        return $updated_array;
    }

    public function getArrayDiffUsingKeys($new_array, $old_array, $keys)
    {
        $remove = [];
        $add = [];
        foreach ($new_array as $new_el) {
            if (!$this->inArrayUsingKeys($old_array, $new_el, $keys)) {
                $add[] = $new_el;
            }
        }
        foreach ($old_array as $old_el) {
            if (!$this->inArrayUsingKeys($new_array, $old_el, $keys)) {
                $remove[] = $old_el;
            }
        }
        return Array("del" => $remove, "add" => $add);
    }

    public function inArrayUsingKeys($array, $element, $keys)
    {
        $in = false;
        foreach ($array as $el) {
            $same = true;
            foreach ($keys as $key) {
                if ($el[$key] != $element[$key]) {
                    $same = false;
                    break;
                }
            }
            if ($same) {
                $in = true;
                break;
            }
        }
        return $in;
    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        if (isset($object["id"]) && $object["id"]) {
            $event = $this->doctrine->getRepository("Twake\Calendar:Event")->find($object["id"]);
            if (!$event) {
                return false;
            }
            $did_create = false;
        } else {
            $event = new Event($object["title"], intval($object["from"]), intval($object["to"]));
            $event->setFrontId($object["front_id"]);
            if (isset($object["workspaces_calendars"]) && is_array($object["workspaces_calendars"])) {
                $event->setWorkspaceId($object["workspaces_calendars"][0]["workspace_id"]);
            }
            $did_create = true;
        }

        //Manage infos
        $old_event = $event->getAsArray();
        $event->setTitle($object["title"]);
        $event->setDescription($object["description"]);
        $event->setLocation($object["location"]);
        $event->setPrivate($object["private"]);
        $event->setAvailable($object["available"]);

        //Manage dates
        $object["type"] = in_array($object["type"], ["event", "remind", "move", "deadline"]) ? $object["type"] : "event";
        if (!isset($object["from"]) || !$object["from"]) {
            if (isset($object["to"])) {
                $object["from"] = $object["to"] - 60 * 60;
            } else {
                $object["from"] = intval(date("U") / (15 * 60)) * 15 * 60;
            }
        }
        if (!isset($object["to"]) || !$object["to"]) {
            $object["to"] = $object["from"] + 60 * 60;
        }
        $tmp_sort_key = json_encode($event->getSortKey());
        $from_changed = ($object["from"] != $event->getFrom());
        $event->setFrom(intval($object["from"]));
        $event->setTo(intval($object["to"]));
        $event->setAllDay($object["all_day"]);
        $event->setType($object["type"]);
        $event->setRepetitionDefinition($object["repetition_definition"]);
        $sort_key = json_encode($event->getSortKey());
        if ($sort_key != $tmp_sort_key) {
            $sort_key_has_changed = true;
        }

        $event->setEventLastModified();

        if (isset($object["tags"])) {
            $event->setTags($object["tags"]);
        }


        $this->doctrine->persist($event);
        $this->doctrine->flush();

        if (isset($object["attachments"]) || $did_create) {
            $this->attachementManager->updateAttachements($event, $object["attachments"] ? $object["attachments"] : Array());
        }

        $old_participants = $event->getParticipants();
        if (isset($object["participants"]) || $did_create || $sort_key_has_changed) {

            if (!isset($object["participants"])) {
                $object["participants"] = $event->getParticipants();
            }

            if (count($object["workspaces_calendars"]) == 0 && count($object["participants"]) == 0 && !$current_user) {
                return false;
            }
            if (count($object["workspaces_calendars"]) == 0 && $current_user) {
                if (!is_array($object["participants"])) {
                    $object["participants"] = [];
                }
                $object["participants"] = array_merge([Array("user_id_or_mail" => $current_user->getId())], $object["participants"]);
            }
            if (count($object["participants"]) > 0 && count($object["workspaces_calendars"]) == 0) {
                if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $object["participants"][0]["user_id_or_mail"])) {
                    $event->setOwner($current_user ? $current_user->getId() : $object["participants"][0]["user_id_or_mail"]);
                } else {
                    //No user (except mails) and no workspaces
                    $this->doctrine->remove($event);
                    $this->doctrine->flush();
                    return false;
                }
            }


            $this->updateParticipants($event, $object["participants"] ? $object["participants"] : Array(), $sort_key_has_changed || $did_create);
        }
        if (isset($object["workspaces_calendars"]) || $sort_key_has_changed) {

            if (!isset($object["workspaces_calendars"])) {
                $object["workspaces_calendars"] = $event->getWorkspacesCalendars();
            }

            if (count($object["workspaces_calendars"]) > 0) {
                $event->setOwner("");
            }

            $this->updateCalendars($event, $object["workspaces_calendars"] ? $object["workspaces_calendars"] : Array(), $sort_key_has_changed || $did_create);
        }


        //After checking user id or mails, we verify event is somewere
        if (count($event->getParticipants()) == 0 && count($event->getWorkspacesCalendars()) == 0) {
            $this->doctrine->remove($event);
            $this->doctrine->flush();
            return false;
        }

        if (isset($object["notifications"]) || $sort_key_has_changed || $from_changed) {

            if (!isset($object["notifications"])) {
                $object["notifications"] = $event->getNotifications();
            }

            $this->updateNotifications($event, $object["notifications"] ? $object["notifications"] : Array(), ($sort_key_has_changed || $did_create || $from_changed));
        }


        //Notify modification for participant users
        $evt = Array(
            "client_id" => "system",
            "action" => "save",
            "object_type" => "",
            "object" => $event->getAsArray()
        );
        $done = [];
        foreach (array_merge($event->getParticipants(), $old_participants) as $participant) {
            if (!in_array($participant["user_id_or_mail"], $done) && preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                $done[] = $participant["user_id_or_mail"];
                $this->enc_pusher->push("calendar_events/user/" . $participant["user_id_or_mail"], $evt);
            }
        }

        //Send invitation or update mails
        foreach ($event->getParticipants() as $participant) {
            if (filter_var($participant["user_id_or_mail"], FILTER_VALIDATE_EMAIL)) {
                $mail = $participant["user_id_or_mail"];
            } else if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                $user = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
                if (!$user || ($current_user && $user->getId() == $current_user->getId())) {
                    continue;
                }
                $mail = $user->getEmail();
            } else {
                continue;
            }
            $not_in_previous_participants = true;
            foreach ($old_participants as $old_participant) {
                if ($old_participant["user_id_or_mail"] == $mail) {
                    $not_in_previous_participants = false;
                    break;
                }
            }
            if ($did_create || $not_in_previous_participants) {
                $this->notifications->sendCustomMail(
                    $mail, "event_invitation", Array(
                    "_language" => $current_user ? $current_user->getLanguage() : "en",
                    "event" => $event->getAsArray(),
                    "user_timezone_delay" => $current_user ? (intval($current_user->getTimezone())) : null,
                    "user_timezone_text" => str_replace("+-", "-", $current_user ? ("GMT+" . ($current_user->getTimezone() / 60)) : "GMT+0"),
                    "sender_fullname" => $current_user ? ("@" . $current_user->getUsername()) : null,
                    "sender_email" => $current_user ? $current_user->getEmail() : null
                ),
                    [Array("type" => "raw", "data" => $this->calendarExport->generateIcs([$event->getAsArray()]), "filename" => "event.ics", "mimetype" => "text/calendar")]
                );
            } else if ($this->hasRealChange($old_event, $event->getAsArray())) {
                $this->notifications->sendCustomMail(
                    $mail, "event_invitation_updated", Array(
                    "_language" => $current_user ? $current_user->getLanguage() : "en",
                    "event" => $event->getAsArray(),
                    "user_timezone_delay" => $current_user ? (intval($current_user->getTimezone())) : null,
                    "user_timezone_text" => str_replace("+-", "-", $current_user ? ("GMT+" . ($current_user->getTimezone() / 60)) : "GMT+0"),
                    "sender_fullname" => $current_user ? ("@" . $current_user->getUsername()) : null,
                    "sender_email" => $current_user ? $current_user->getEmail() : null
                ),
                    [Array("type" => "raw", "data" => $this->calendarExport->generateIcs([$event->getAsArray()]), "filename" => "event.ics", "mimetype" => "text/calendar")]


                );
            }

        }


        //Notify connectors
        $resources = [];
        $done = [];
        foreach ($event->getWorkspacesCalendars() as $calendar) {
            $workspace_id = $calendar["workspace_id"];
            if (!in_array($workspace_id, $done)) {
                $done[] = $workspace_id;
                $resources = array_merge($resources, $this->applications_api->getResources($workspace_id, "workspace_calendar", $workspace_id));
            }
        }
        $apps_ids = [];
        foreach ($resources as $resource) {
            if (in_array("event", $resource->getApplicationHooks())) {
                $apps_ids[] = $resource->getApplicationId();
            }
        }
        if (count($apps_ids) > 0) {
            foreach ($apps_ids as $app_id) {
                if ($app_id) {
                    $data = Array(
                        "event" => $event->getAsArray()
                    );
                    if ($did_create) {
                        $this->applications_api->notifyApp($app_id, "hook", "new_event", $data);
                    } else {
                        $this->applications_api->notifyApp($app_id, "hook", "edit_event", $data);
                    }
                }
            }
        }


        return $event->getAsArray();
    }

    public function updateCalendars(Event $event, $calendars = Array(), $replace_all = false)
    {
        $sort_key = $event->getSortKey();

        $calendars = $calendars ? $calendars : [];

        $updated_calendars = $this->formatArrayInput($calendars, ["calendar_id", "workspace_id"]);
        $current_calendars = $event->getWorkspacesCalendars();
        $event->setWorkspacesCalendars($updated_calendars);
        $this->doctrine->persist($event);

        $get_diff = $this->getArrayDiffUsingKeys($updated_calendars, $current_calendars, ["calendar_id", "workspace_id"]);

        if (count($get_diff["del"]) > 0 || $replace_all) {
            $calendars_in_event = $this->doctrine->getRepository("Twake\Calendar:EventCalendar")->findBy(Array("event_id" => $event->getId()));
            foreach ($calendars_in_event as $calendar) {
                if (!$this->inArrayUsingKeys($get_diff["del"], ["calendar_id" => $calendar->getCalendarId(), "workspace_id" => $calendar->getWorkspaceId()], ["calendar_id", "workspace_id"]) || $replace_all) {
                    //Remove old participants
                    $this->doctrine->remove($calendar);
                }
            }
        }

        foreach (($replace_all ? $updated_calendars : $get_diff["add"]) as $calendar) {
            foreach ($sort_key as $sort_date) {
                $user = new EventCalendar($calendar["workspace_id"], $calendar["calendar_id"], $event->getId(), $sort_date);
                $this->doctrine->persist($user);
            }
        }

        $this->doctrine->flush();

    }

    public function updateNotifications(Event $event, $notifications = Array(), $replace_all = false)
    {

        $notifications = $notifications ? $notifications : [];
        $token = base64_encode(bin2hex(random_bytes(32)));

        foreach ($notifications as $index => $notification) {
            $notifications[$index]["token"] = $token;
        }

        $updated_notifications = $this->formatArrayInput($notifications, ["delay", "mode"]);
        $event->setNotifications($updated_notifications);
        $this->doctrine->persist($event);
        $this->doctrine->flush();

        foreach ($updated_notifications as $notification) {
            if ($event->getFrom() - $notification["delay"] < date("U")) {
                continue;
            }

            $this->queues_scheduled->schedule("calendar_events", $event->getFrom() - $notification["delay"], [
                "token" => $token,
                "event_id" => $event->getId(),
                "delay" => $notification["delay"],
                "mode" => $notification["mode"]
            ]);
        }

    }

    public function hasRealChange($old_event, $new_event)
    {
        return ($old_event["from"] != $new_event["from"] || $old_event["to"] != $new_event["to"]
            || strlen(str_replace(" ", "", $old_event["title"] . "")) - strlen(trim($new_event["title"] . "")) > 10
            || strlen(str_replace(" ", "", $old_event["location"] . "")) - strlen(trim($new_event["location"] . "")) > 10
            || strlen(str_replace(" ", "", $old_event["description"] . "")) - strlen(trim($new_event["description"] . "")) > 10);
    }

    public function checkReminders()
    {

        $sent = 0;

        $notifications = $this->queues_scheduled->consume("calendar_events", true);

        foreach ($notifications ?: [] as $notification_original) {

            $notification = $this->queues_scheduled->getMessage($notification_original);

            //Send notification
            /** @var EventCalendar $event */
            $event = $this->doctrine->getRepository("Twake\Calendar:Event")->findOneBy(Array("id" => $notification["event_id"]));

            if ($event) {

                $existing_notifications = $event->getNotifications();
                $valid_notification = false;
                foreach ($existing_notifications as $existing_notification) {
                    //Verify this received notification exists in calendar event
                    if ($existing_notification["token"] == $notification["token"]) {
                        $valid_notification = true;
                    }
                }

                if ($valid_notification) {

                    $delay = floor($notification["delay"] / 60) . "min";
                    if ($notification["delay"] > 60 * 60) {
                        $delay = floor($notification["delay"] / (60 * 60)) . "h";
                    }
                    if ($notification["delay"] > 60 * 60 * 24) {
                        $delay = floor($notification["delay"] / (60 * 60 * 24)) . "j";
                    }
                    if ($notification["delay"] > 60 * 60 * 24 * 7 * 2) {
                        $delay = floor($notification["delay"] / (60 * 60 * 24 * 7)) . "w";
                    }

                    $title = "Untitled";
                    if ($event->getTitle()) {
                        $title = $event->getTitle();
                    }
                    $text = $title . " in " . $delay;

                    $participants = $event->getParticipants();

                    foreach ($participants as $participant) {
                        if ($notification["mode"] == "mail" || !$notification["mode"]) {
                            $mail = $participant["user_id_or_mail"];
                            $language = false;
                            if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                                $mail = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
                                if ($mail) {
                                    $language = $mail->getLanguage();
                                    $mail = $mail->getEMail();
                                } else {
                                    $mail = null;
                                }
                            }
                            //Mail
                            if ($mail) {
                                $this->notifications->sendCustomMail(
                                    $mail, "event_notification", Array(
                                        "_language" => $language ? $language : "en",
                                        "text" => $text,
                                        "delay" => $delay,
                                        "event" => $event->getAsArray()
                                    )
                                );
                            }
                        }
                        if ($notification["mode"] == "push" || !$notification["mode"]) {
                            //Push notification
                            if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                                $user = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
                                if ($user) {
                                    $this->notifications->pushDevice(
                                        $user, $text, "📅 Calendar notification", null
                                    );
                                }
                            }
                        }
                    }

                }

            }

            $sent++;
            $this->queues_scheduled->ack("calendar_events", $notification_original);

        }

        return $sent;

    }

}
