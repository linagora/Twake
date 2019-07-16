<?php

namespace WebsiteApi\TasksBundle\Services;


class BoardList
{

    function __construct($entity_manager, $enc_pusher, $application_api, $notifications, $board_listExport)
    {
        $this->doctrine = $entity_manager;
        $this->boardExport = $board_listExport;
        $this->enc_pusher = $enc_pusher;
        $this->applications_api = $application_api;
        $this->notifications = $notifications;
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
        $board_list_id = $options["board_id"];

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $lists = $this->doctrine->getRepository("TwakeTasksBundle:BoardList")->findBy(Array("board_id" => $board_list_id));

        $ret = [];
        foreach ($lists as $list) {
            $ret[] = $list->getAsArray();
        }

        return $ret;
    }

    public function remove($object, $options, $current_user = null)
    {
        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $board_list = $this->doctrine->getRepository("TwakeTasksBundle:BoardList")->findOneBy(Array("id" => $id));
        if (!$board_list) {
            return false;
        }

        $this->doctrine->remove($board_list);
        $this->doctrine->flush();

        return $object;
    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $did_create = false;
        if (isset($object["id"])) {
            $board_list = $this->doctrine->getRepository("TwakeTasksBundle:Board")->findOneBy(Array("id" => $object["id"]));
            if (!$board_list) {
                return false;
            }
        } else {
            $did_create = true;
            $board_list = new Board($object["board_id"], "", "");
            $board_list->setFrontId($object["front_id"]);
        }

        $board_list->setTitle($object["title"]);
        $board_list->setColor($object["color"]);
        $board_list->setAutoParticipants($object["auto_participants"]);
        $this->doctrine->persist($board_list);
        $this->doctrine->flush();

        return $board_list->getAsArray();

    }

}