<?php

namespace Twake\Tasks\Services;

use App\App;

class BoardList
{

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->boardExport = $app->getServices()->get("app.tasks.export");
        $this->enc_pusher = $app->getServices()->get("app.websockets");
        $this->applications_api = $app->getServices()->get("app.applications_api");
        $this->notifications = $app->getServices()->get("app.notifications");
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
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

        $lists = $this->doctrine->getRepository("Twake\Tasks:BoardList")->findBy(Array("board_id" => $board_list_id));

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

        $board_list = $this->doctrine->getRepository("Twake\Tasks:BoardList")->findOneBy(Array("id" => $id));
        if (!$board_list) {
            return false;
        }

        $this->removeAllTasks($object, $options, $current_user = null);

        $this->doctrine->remove($board_list);
        $this->doctrine->flush();

        return $object;
    }

    public function removeAllTasks($object, $options, $current_user = null)
    {

        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $only_archived = $options["only_archived_tasks"];

        $board_list = $this->doctrine->getRepository("Twake\Tasks:BoardList")->findOneBy(Array("id" => $id));
        if (!$board_list) {
            return false;
        }

        $ws_events = [];
        $ws_task_users = [];

        //Remove all tasks and update count in board
        $tasks = $this->doctrine->getRepository("Twake\Tasks:Task")->findBy(Array("list_id" => $id));
        $count = 0;
        foreach ($tasks as $task) {
            if (!$only_archived || $task->getArchived()) {

                if (!$task->getArchived()) {
                    $count++;
                }

                $this->doctrine->remove($task);

                //Send websocket notification
                $ws_events[] = Array(
                    "client_id" => "system",
                    "action" => "remove",
                    "object_type" => "",
                    "front_id" => $task->getFrontId()
                );
                foreach ($task->getParticipants() as $participant) {
                    if (!is_string($participant)) {
                        $participant = $participant["user_id_or_mail"];
                    }
                    $ws_task_users[] = $participant;
                }

            }
        }
        $board = $this->doctrine->getRepository("Twake\Tasks:Board")->findOneBy(Array("id" => $board_list->getBoardId()));
        $board->setActiveTasks($board->getActiveTasks() - $count);
        $this->doctrine->persist($board);

        $this->doctrine->flush();

        if (count($ws_events) > 0) {
            $this->enc_pusher->push("board_tasks/" . $board_list->getBoardId(), $ws_events);
            $ws_task_users = array_unique($ws_task_users);
            foreach ($ws_task_users as $ws_task_user) {
                $this->enc_pusher->push("board_tasks/user_" . $ws_task_user, $ws_events);
            }
        }

    }

    public function archiveAllTasks($object, $options, $current_user = null)
    {

        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $board_list = $this->doctrine->getRepository("Twake\Tasks:BoardList")->findOneBy(Array("id" => $id));
        if (!$board_list) {
            return false;
        }

        //Remove all tasks and update count in board
        $tasks = $this->doctrine->getRepository("Twake\Tasks:Task")->findBy(Array("list_id" => $id));
        $count = 0;

        $ws_events = [];
        $ws_task_users = [];

        foreach ($tasks as $task) {
            if (!$task->getArchived()) {

                $task->setArchived(true);
                $this->doctrine->persist($task);
                $count++;

                //Send websocket notification
                $ws_events[] = Array(
                    "client_id" => "system",
                    "action" => "save",
                    "object_type" => "",
                    "object" => $task->getAsArray()
                );
                foreach ($task->getParticipants() as $participant) {
                    if (!is_string($participant)) {
                        $participant = $participant["user_id_or_mail"];
                    }
                    $ws_task_users[] = $participant;
                }

            }
        }

        $board = $this->doctrine->getRepository("Twake\Tasks:Board")->findOneBy(Array("id" => $board_list->getBoardId()));
        $board->setActiveTasks($board->getActiveTasks() - $count);
        $this->doctrine->persist($board);

        $this->doctrine->flush();

        if (count($ws_events) > 0) {
            $this->enc_pusher->push("board_tasks/" . $board_list->getBoardId(), $ws_events);
            $ws_task_users = array_unique($ws_task_users);
            foreach ($ws_task_users as $ws_task_user) {
                $this->enc_pusher->push("board_tasks/user_" . $ws_task_user, $ws_events);
            }
        }

    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $did_create = false;
        if (isset($object["id"])) {
            $board_list = $this->doctrine->getRepository("Twake\Tasks:BoardList")->findOneBy(Array("id" => $object["id"]));
            if (!$board_list) {
                return false;
            }
        } else {
            $did_create = true;
            $board_list = new \Twake\Tasks\Entity\BoardList($object["board_id"], "", "");
            $board_list->setFrontId($object["front_id"]);
        }

        if (isset($object["title"])) $board_list->setTitle($object["title"]);
        if (isset($object["color"])) $board_list->setColor($object["color"]);
        if (isset($object["emoji"])) $board_list->setEmoji($object["emoji"]);

        if (isset($object["order"])) $board_list->setOrder($object["order"]);

        if (isset($object["auto_participants"])) $board_list->setAutoParticipants($object["auto_participants"]);

        $this->doctrine->persist($board_list);
        $this->doctrine->flush();

        return $board_list->getAsArray();

    }

}