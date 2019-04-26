<?php

namespace WebsiteApi\CalendarBundle\Services;


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

        }

        if ($mode == "user") {

            $events_links = [];
            foreach (($options["users_ids_or_mails"] ? $options["users_ids_or_mails"] : []) as $user_id_or_mail) {
                $events_links = array_merge($this->doctrine->getRepository("TwakeCalendarBundle:EventUser")->findRange(Array("user_id_or_mail" => $user_id_or_mail), "sort_date", $after_ts, $before_ts));
            }

            $events_ids = [];
            foreach ($events_links as $event_link) {
                $events_ids[] = $event_link->getEventId();
            }

        }

        array_unique($events_ids);

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

        //TODO

        return $object;
    }

}