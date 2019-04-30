<?php

namespace WebsiteApi\CalendarBundle\Services;


use WebsiteApi\CalendarBundle\Entity\Event;
use WebsiteApi\CalendarBundle\Entity\EventNotification;
use WebsiteApi\CalendarBundle\Entity\EventUser;

class CalendarEvent
{

    function __construct($entity_manager)
    {
        $this->doctrine = $entity_manager;
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in CoreBundle/Services/Websockets.php */
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

        $after_ts = $options["after_ts"];
        $before_ts = $options["before_ts"];
        $mode = $options["mode"]; //User or workspace

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if ($mode == "workspace") {


            $events_links = [];
            foreach (($options["calendar_list"] ? $options["calendar_list"] : []) as $object) {
                $workspace_id = $object["workspace_id"];
                $calendar_id = $object["calendar_id"];
                $events_links = array_merge($this->doctrine->getRepository("TwakeCalendarBundle:EventCalendar")->findRange(Array("workspace_id" => $workspace_id, "calendar_id" => $calendar_id), "sort_date", $after_ts, $before_ts));
            }

            $events_ids = [];
            foreach ($events_links as $event_link) {
                $events_ids[] = $event_link->getEventId();
            }

        } else {

            if (!isset($options["users_ids_or_mails"]) && $current_user) {
                $options["users_ids_or_mails"] = [$current_user->getId()];
            }

            $events_links = [];
            foreach (($options["users_ids_or_mails"] ? $options["users_ids_or_mails"] : []) as $user_id_or_mail) {
                $events_links = array_merge($this->doctrine->getRepository("TwakeCalendarBundle:EventUser")->findRange(Array("user_id_or_mail" => $user_id_or_mail), "sort_date", $after_ts, $before_ts));
            }

            $events_ids = [];
            foreach ($events_links as $event_link) {
                $events_ids[] = $event_link->getEventId();
            }

        }

        $events_ids = array_unique($events_ids);

        $ret = [];
        foreach ($events_ids as $id) {
            $event = $this->doctrine->getRepository("TwakeCalendarBundle:Event")->find($id);
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
        $entities = $this->doctrine->getRepository("TwakeCalendarBundle:EventCalendar")->findBy(Array("event_id" => $id));
        $entities = array_merge($entities, $this->doctrine->getRepository("TwakeCalendarBundle:EventNotification")->findBy(Array("event_id" => $id)));
        $entities = array_merge($entities, $this->doctrine->getRepository("TwakeCalendarBundle:EventUser")->findBy(Array("event_id" => $id)));
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

        $event = $this->doctrine->getRepository("TwakeCalendarBundle:Event")->find($id);
        if (!$event) {
            return false;
        }

        $this->doctrine->remove($event);
        $this->doctrine->flush();

        $this->removeEventDependancesById($id);

        return $object;
    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        if (isset($object["id"])) {
            $event = $this->doctrine->getRepository("TwakeCalendarBundle:Event")->find($object["id"]);
            if (!$event) {
                return false;
            }
            $did_create = false;
        } else {
            $event = new Event($object["title"], $object["from"], $object["to"]);
            $event->setFrontId($object["front_id"]);
            $did_create = true;
        }

        //Manage infos
        $event->setTitle($object["title"]);
        $event->setDescription($object["description"]);
        $event->setLocation($object["location"]);
        $event->setPrivate($object["private"]);
        $event->setAvailable($object["available"]);

        //Manage dates
        $object["type"] = in_array($object["type"], ["event", "remind", "move", "deadline"]) ? $object["type"] : "event";
        if (!isset($object["from"])) {
            if (isset($object["to"])) {
                $object["from"] = $object["to"] - 60 * 60;
            } else {
                $object["from"] = intval(date("U") / (15 * 60)) * 15 * 60;
            }
        }
        if (!isset($object["to"])) {
            $object["to"] = $object["from"] + 60 * 60;
        }
        $tmp_sort_key = json_encode($event->getSortKey());
        $event->setFrom($object["from"]);
        $event->setTo($object["to"]);
        $event->setAllDay($object["all_day"]);
        $event->setType($object["type"]);
        $event->setRepetitionDefinition($object["repetition_definition"]);
        $sort_key = json_encode($event->getSortKey());
        if ($sort_key != $tmp_sort_key) {
            $sort_key_has_changed = true;
        }

        $this->doctrine->flush();

        if (count($object["workspaces_calendars"]) == 0 && count($object["participants"]) == 0) {
            if (!$current_user) {
                return false; //No calendar and no user
            }
            //Add current user at least
            $object["participants"] = [Array("user_id_or_mail" => $current_user->getId())];
        }

        $this->updateParticipants($event, $object["participants"], $sort_key_has_changed || $did_create);
        $this->updateCalendars($event, $object["workspaces_calendars"], $sort_key_has_changed || $did_create);
        $this->updateNotifications($event, $object["notifications"], $sort_key_has_changed || $did_create);

        return $event->getAsArray();
    }

    private function updateParticipants(Event $event, $participants = Array(), $replace_all = false)
    {
        $sort_key = $event->getSortKey();

        $participants = $participants ? $participants : [];

        $updated_participants = $this->formatArrayInput($participants, ["user_id_or_mail"]);
        $current_participants = $event->getParticipants();
        $event->setParticipants($updated_participants);
        $this->doctrine->persist($event);

        $get_diff = $this->getArrayDiffUsingKeys($updated_participants, $current_participants, ["user_id_or_mail"]);

        if (count($get_diff["del"]) > 0 || $replace_all) {
            $users_in_event = $this->doctrine->getRepository("TwakeCalendarBundle:EventUser")->findBy(Array("event_id" => $event->getId()));
            foreach ($users_in_event as $user) {
                if (!$this->inArrayUsingKeys($get_diff["del"], Array("user_id_or_mail" => $user->getUserIdOrMail()), ["user_id_or_mail"]) || $replace_all) {
                    //Remove old participants
                    $this->doctrine->remove($user);
                }
            }
        }

        foreach (($replace_all ? $updated_participants : $get_diff["add"]) as $participant) {
            foreach ($sort_key as $sort_date) {
                $user = new EventUser($participant["user_id_or_mail"], $event->getId(), $sort_date);
                $this->doctrine->persist($user);
            }
        }

        $this->doctrine->flush();
    }

    private function updateCalendars(Event $event, $calendars = Array(), $replace_all = false)
    {
        $sort_key = $event->getSortKey();

        $calendars = $calendars ? $calendars : [];

        $updated_calendars = $this->formatArrayInput($calendars, ["calendar_id", "workspace_id"]);
        $current_calendars = $event->getWorkspacesCalendars();
        $event->setWorkspacesCalendars($updated_calendars);
        $this->doctrine->persist($event);

        $get_diff = $this->getArrayDiffUsingKeys($updated_calendars, $current_calendars, ["calendar_id", "workspace_id"]);

        if (count($get_diff["del"]) > 0 || $replace_all) {
            $calendars_in_event = $this->doctrine->getRepository("TwakeCalendarBundle:EventCalendar")->findBy(Array("event_id" => $event->getId()));
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

    private function updateNotifications(Event $event, $notifications = Array(), $replace_all = false)
    {

        $notifications = $notifications ? $notifications : [];

        $updated_notifications = $this->formatArrayInput($notifications, ["delay", "mode"]);
        $current_notifications = $event->getNotifications();
        $event->setNotifications($updated_notifications);
        $this->doctrine->persist($event);

        $get_diff = $this->getArrayDiffUsingKeys($updated_notifications, $current_notifications, ["delay", "mode"]);

        if (count($get_diff["del"]) > 0 || $replace_all) {
            $notifications_in_event = $this->doctrine->getRepository("TwakeCalendarBundle:EventNotification")->findBy(Array("event_id" => $event->getId()));
            foreach ($notifications_in_event as $notification) {
                if (!$this->inArrayUsingKeys($get_diff["del"], ["delay" => $notification->getDelay(), "mode" => $notification->getMode()], ["mode", "delay"]) || $replace_all) {
                    //Remove old participants
                    $this->doctrine->remove($notification);
                }
            }
        }

        foreach (($replace_all ? $updated_notifications : $get_diff["add"]) as $notification) {
            $notification = new EventNotification($event->getId(), $notification["delay"], $event->getFrom() + $notification["delay"], $notification["mode"]);
            $this->doctrine->persist($notification);
        }

        $this->doctrine->flush();

    }

    private function getArrayDiffUsingKeys($new_array, $old_array, $keys)
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

    private function inArrayUsingKeys($array, $element, $keys)
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

    private function formatArrayInput($array, $id_keys = [])
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

}