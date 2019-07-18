<?php

namespace WebsiteApi\TasksBundle\Services;


use WebsiteApi\TasksBundle\Entity\Board;

class BoardBoard
{

    function __construct($entity_manager, $application_api)
    {
        $this->doctrine = $entity_manager;
        $this->applications_api = $application_api;
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
        $boards = $this->doctrine->getRepository("TwakeTasksBundle:Board")->findBy(Array("workspace_id" => $workspace_id));

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if (count($boards) == 0) {
            $board = $this->save(Array(
                "workspace_id" => $workspace_id,
                "title" => "First Board",
                "emoji" => ":clipboard:",
            ), Array(), null);

            //TODO Add example tasks in board

            if ($board) {
                return [$board];
            }

        }

        $ret = [];
        foreach ($boards as $board) {
            $ret[] = $board->getAsArray();
        }

        return $ret;
    }

    public function remove($object, $options, $current_user = null)
    {
        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $board = $this->doctrine->getRepository("TwakeTasksBundle:Board")->findOneBy(Array("id" => $id));
        if (!$board) {
            return false;
        }

        $this->doctrine->remove($board);
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
            $board = $this->doctrine->getRepository("TwakeTasksBundle:Board")->findOneBy(Array("id" => $object["id"]));
            if (!$board) {
                return false;
            }
        } else {
            $did_create = true;
            $board = new Board($object["workspace_id"], "");
            $board->setFrontId($object["front_id"]);
        }

        $board->setTitle($object["title"]);
        $board->setEmoji($object["emoji"]);
        $board->setGroupName($object["group_name"]);
        $this->doctrine->persist($board);
        $this->doctrine->flush();

        $this->updateConnectors($board, $object["connectors"], $current_user->getId());

        //Notify connectors
        $workspace_id = $board->getWorkspaceId();
        $resources = $this->applications_api->getResources($workspace_id, "workspace_board", $workspace_id);
        $apps_ids = [];
        foreach ($resources as $resource) {
            if (in_array("board", $resource->getApplicationHooks())) {
                $apps_ids[] = $resource->getApplicationId();
            }
        }
        if (count($apps_ids) > 0) {
            foreach ($apps_ids as $app_id) {
                if ($app_id) {
                    $data = Array(
                        "board" => $board->getAsArray()
                    );
                    if ($did_create) {
                        $this->applications_api->notifyApp($app_id, "hook", "new_board", $data);
                    } else {
                        $this->applications_api->notifyApp($app_id, "hook", "edit_board", $data);
                    }
                }
            }
        }

        return $board->getAsArray();

    }

    private function updateConnectors($board_entity, $connectors_ids, $current_user_id = null)
    {

        if (!$connectors_ids) {
            $connectors_ids = [];
        }

        $current_connectors = $board_entity->getConnectors();
        $current_connectors = $current_connectors ? $current_connectors : [];

        $did_something = false;

        foreach ($connectors_ids as $connector_id) {
            if (!in_array($connector_id, $current_connectors)) {
                $this->applications_api->addResource($connector_id, $board_entity->getWorkspaceId(), "board", $board_entity->getId(), $current_user_id);
                $did_something = true;
            }
        }

        foreach ($current_connectors as $current_connector_id) {
            if (!in_array($current_connector_id, $connectors_ids)) {
                $this->applications_api->removeResource($connector_id, $board_entity->getWorkspaceId(), "board", $board_entity->getId(), $current_user_id);
                $did_something = true;
            }
        }

        if ($did_something) {
            $board_entity->setConnectors($connectors_ids);
            $this->doctrine->persist($board_entity);
            $this->doctrine->flush();
        }

    }

}