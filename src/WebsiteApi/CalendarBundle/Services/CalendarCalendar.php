<?php

namespace WebsiteApi\CalendarBundle\Services;


use WebsiteApi\CalendarBundle\Entity\Calendar;

class CalendarCalendar
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
        return true;
    }

    public function get($options, $current_user)
    {
        $workspace_id = $options["workspace_id"];
        $calendars = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findBy(Array("workspace_id" => $workspace_id));

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $ret = [];
        foreach ($calendars as $calendar) {
            $ret[] = $calendar->getAsArray();
        }

        return $ret;
    }

    public function remove($object, $options, $current_user = null)
    {
        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($id);
        if (!$calendar) {
            return false;
        }

        $this->doctrine->remove($calendar);
        $this->doctrine->flush();

        $this->doctrine->getRepository("TwakeCalendarBundle:EventCalendar")->removeBy(Array("workspace_id" => $calendar->getWorkspaceId(), "calendar_id" => $id));

        return $object;
    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        if (isset($object["id"])) {
            $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($object["id"]);
            if (!$calendar) {
                return false;
            }
        } else {
            $calendar = new Calendar($object["workspace_id"], "", "");
            $calendar->setFrontId($object["front_id"]);
        }

        $calendar->setTitle($object["title"]);
        $calendar->setColor($object["color"]);
        $calendar->setAutoParticipants($object["auto_participants"]);


        return $calendar->getAsArray();

    }
}