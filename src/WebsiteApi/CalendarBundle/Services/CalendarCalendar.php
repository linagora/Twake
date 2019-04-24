<?php

namespace WebsiteApi\CalendarBundle\Services;


class CalendarCalendar
{

    function __construct($entity_manager)
    {
        $this->doctrine = $entity_manager;
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in CoreBundle/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        //TODO
        return true;
    }

    public function hasAccess($data, $current_user = null)
    {
        return true;
    }

    public function get($options, $current_user)
    {

    }

    public function remove($object, $options, $current_user = null)
    {

    }

    public function save($object, $options, $current_user)
    {

    }
}