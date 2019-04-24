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
        //TODO
        return true;
    }

    public function hasAccess($data, $current_user = null)
    {
        return true;
    }

    public function get($options, $current_user)
    {
        return [];
    }

    public function remove($object, $options, $current_user = null)
    {
        return Array();
    }

    public function save($object, $options, $current_user)
    {
        return Array();
    }

}