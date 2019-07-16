<?php

namespace WebsiteApi\TasksBundle\Services;


use WebsiteApi\TasksBundle\Entity\Task;
use WebsiteApi\TasksBundle\Entity\TaskNotification;
use WebsiteApi\TasksBundle\Entity\TaskUser;
use WebsiteApi\TasksBundle\Entity\TaskBoard;

class BoardTask
{

    function __construct($entity_manager, $enc_pusher, $application_api, $notifications, $boardExport)
    {
        $this->doctrine = $entity_manager;
        $this->boardExport = $boardExport;
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

        if ($data["entity"]) {
            //Test we have access to this task
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

        $tasks_ids = [];
        if ($mode == "workspace" || $mode == "both") {


            $tasks_links = [];
            foreach (($options["board_list"] ? $options["board_list"] : []) as $object) {
                $workspace_id = $object["workspace_id"];
                $board_id = $object["board_id"];
                if ($board_id && $workspace_id) {
                    $tasks_links = array_merge($tasks_links, $this->doctrine->getRepository("TwakeTasksBundle:TaskBoard")->findRange(Array("workspace_id" => $workspace_id, "board_id" => $board_id), "sort_date", $after_ts, $before_ts));
                }
            }

            foreach ($tasks_links as $task_link) {
                $tasks_ids[] = $task_link->getTaskId();
            }

        }
        if ($mode == "mine" || $mode == "both") {

            if (!isset($options["users_ids_or_mails"]) && $current_user) {
                $options["users_ids_or_mails"] = [$current_user->getId()];
            }

            $tasks_links = [];
            foreach (($options["users_ids_or_mails"] ? $options["users_ids_or_mails"] : []) as $user_id_or_mail) {
                $tasks_links = array_merge($tasks_links, $this->doctrine->getRepository("TwakeTasksBundle:TaskUser")->findRange(Array("user_id_or_mail" => $user_id_or_mail), "sort_date", $after_ts, $before_ts));
            }

            foreach ($tasks_links as $task_link) {
                $tasks_ids[] = $task_link->getTaskId();
            }

        }

        $tasks_ids = array_unique($tasks_ids);

        $ret = [];
        foreach ($tasks_ids as $id) {
            $task = $this->doctrine->getRepository("TwakeTasksBundle:Task")->find($id);
            if ($task) {
                $ret[] = $task->getAsArray();
            } else {
                //Remove innexistant task
                $this->removeTaskDependancesById($id);
            }
        }

        return $ret;
    }

    private function removeTaskDependancesById($id)
    {
        $entities = $this->doctrine->getRepository("TwakeTasksBundle:TaskBoard")->findBy(Array("task_id" => $id));
        $entities = array_merge($entities, $this->doctrine->getRepository("TwakeTasksBundle:TaskUser")->findBy(Array("task_id" => $id)));
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

        $task = $this->doctrine->getRepository("TwakeTasksBundle:Task")->find($id);
        if (!$task) {
            return false;
        }

        $participants = $task->getParticipants();

        //Quit task
        if ($task->getOwner() && $task->getOwner() != $current_user->getId()) {
            $list = [];
            foreach ($task->getParticipants() as $part) {
                if ($part["user_id_or_mail"] != $current_user->getId()) {
                    $list[] = $part;
                }
            }
            $this->updateParticipants($task, $list, false);

            $evt = Array(
                "client_id" => "system",
                "action" => "save",
                "object_type" => "",
                "object" => $task->getAsArray()
            );

        } //Or delete task
        else {
            $this->doctrine->remove($task);
            $this->doctrine->flush();

            $this->removeTaskDependancesById($id);

            //Notify connectors
            $resources = [];
            $done = [];
            foreach ($task->getWorkspacesBoards() as $board) {
                $workspace_id = $board["workspace_id"];
                if (!in_array($workspace_id, $done)) {
                    $done[] = $workspace_id;
                    $resources = array_merge($resources, $this->applications_api->getResources($workspace_id, "workspace_board", $workspace_id));
                }
            }
            $apps_ids = [];
            foreach ($resources as $resource) {
                if (in_array("task", $resource->getApplicationHooks())) {
                    $apps_ids[] = $resource->getApplicationId();
                }
            }
            if (count($apps_ids) > 0) {
                foreach ($apps_ids as $app_id) {
                    if ($app_id) {
                        $data = Array(
                            "task" => $task->getAsArray()
                        );
                        $this->applications_api->notifyApp($app_id, "hook", "remove_task", $data);
                    }
                }
            }

            $evt = Array(
                "client_id" => "system",
                "action" => "remove",
                "object_type" => "",
                "front_id" => $task->getFrontId()
            );
        }

        //Notify modification for participant users
        foreach ($participants as $participant) {
            if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                $this->enc_pusher->push("board_tasks/user/" . $participant["user_id_or_mail"], $evt);
            }
        }

        return $task->getAsArray();
    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        if (isset($object["id"]) && $object["id"]) {
            $task = $this->doctrine->getRepository("TwakeTasksBundle:Task")->find($object["id"]);
            if (!$task) {
                return false;
            }
            $did_create = false;
        } else {
            $task = new Task($object["title"], $object["from"], $object["to"]);
            $task->setFrontId($object["front_id"]);
            $did_create = true;
        }

        //Manage infos
        $old_task = $task->getAsArray();
        $task->setTitle($object["title"]);
        $task->setDescription($object["description"]);
        $task->setLocation($object["location"]);
        $task->setPrivate($object["private"]);
        $task->setAvailable($object["available"]);

        //Manage dates
        $object["type"] = in_array($object["type"], ["task", "remind", "move", "deadline"]) ? $object["type"] : "task";
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
        $tmp_sort_key = json_encode($task->getSortKey());
        $from_changed = ($object["from"] != $task->getFrom());
        $task->setFrom($object["from"]);
        $task->setTo($object["to"]);
        $task->setAllDay($object["all_day"]);
        $task->setType($object["type"]);
        $task->setRepetitionDefinition($object["repetition_definition"]);
        $sort_key = json_encode($task->getSortKey());
        if ($sort_key != $tmp_sort_key) {
            $sort_key_has_changed = true;
        }

        $task->setTaskLastModified();

        $this->doctrine->persist($task);
        $this->doctrine->flush();

        $old_participants = $task->getParticipants();
        if (isset($object["participants"]) || $did_create || $sort_key_has_changed) {

            if (!isset($object["participants"])) {
                $object["participants"] = $task->getParticipants();
            }

            if (count($object["workspaces_boards"]) == 0 && count($object["participants"]) == 0 && !$current_user) {
                return false;
            }
            if (count($object["workspaces_boards"]) == 0 && $current_user) {
                if (!is_array($object["participants"])) {
                    $object["participants"] = [];
                }
                $object["participants"] = array_merge([Array("user_id_or_mail" => $current_user->getId())], $object["participants"]);
            }
            if (count($object["participants"]) > 0 && count($object["workspaces_boards"]) == 0) {
                if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $object["participants"][0]["user_id_or_mail"])) {
                    $task->setOwner($current_user ? $current_user->getId() : $object["participants"][0]["user_id_or_mail"]);
                } else {
                    //No user (except mails) and no workspaces
                    $this->doctrine->remove($task);
                    $this->doctrine->flush();
                    return false;
                }
            }

            $this->updateParticipants($task, $object["participants"] ? $object["participants"] : Array(), $sort_key_has_changed || $did_create);
        }
        if (isset($object["workspaces_boards"]) || $sort_key_has_changed) {

            if (!isset($object["workspaces_boards"])) {
                $object["workspaces_boards"] = $task->getWorkspacesBoards();
            }

            if (count($object["workspaces_boards"]) > 0) {
                $task->setOwner("");
            }

            $this->updateBoards($task, $object["workspaces_boards"] ? $object["workspaces_boards"] : Array(), $sort_key_has_changed || $did_create);
        }

        //After checking user id or mails, we verify task is somewere
        if (count($task->getParticipants()) == 0 && count($task->getWorkspacesBoards()) == 0) {
            $this->doctrine->remove($task);
            $this->doctrine->flush();
            return false;
        }


        //Notify modification for participant users
        $evt = Array(
            "client_id" => "system",
            "action" => "save",
            "object_type" => "",
            "object" => $task->getAsArray()
        );
        $done = [];
        foreach (array_merge($task->getParticipants(), $old_participants) as $participant) {
            if (!in_array($participant["user_id_or_mail"], $done) && preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                $done[] = $participant["user_id_or_mail"];
                $this->enc_pusher->push("board_tasks/user/" . $participant["user_id_or_mail"], $evt);
            }
        }

        //Send invitation or update mails
        foreach ($task->getParticipants() as $participant) {
            if (filter_var($participant["user_id_or_mail"], FILTER_VALIDATE_EMAIL)) {
                $mail = $participant["user_id_or_mail"];
            } else if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
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
                    $mail, "task_invitation", Array(
                    "_language" => $current_user ? $current_user->getLanguage() : "en",
                    "task" => $task->getAsArray(),
                    "user_timezone_delay" => $current_user ? (intval($current_user->getTimezone())) : null,
                    "user_timezone_text" => str_replace("+-", "-", $current_user ? ("GMT+" . ($current_user->getTimezone() / 60)) : "GMT+0"),
                    "sender_fullname" => $current_user ? ("@" . $current_user->getUsername()) : null,
                    "sender_email" => $current_user ? $current_user->getEmail() : null
                ),
                    [Array("type" => "raw", "data" => $this->boardExport->generateIcs([$task->getAsArray()]), "filename" => "task.ics", "mimetype" => "text/board")]
                );
            } else if ($this->hasRealChange($old_task, $task->getAsArray())) {
                $this->notifications->sendCustomMail(
                    $mail, "task_invitation_updated", Array(
                    "_language" => $current_user ? $current_user->getLanguage() : "en",
                    "task" => $task->getAsArray(),
                    "user_timezone_delay" => $current_user ? (intval($current_user->getTimezone())) : null,
                    "user_timezone_text" => str_replace("+-", "-", $current_user ? ("GMT+" . ($current_user->getTimezone() / 60)) : "GMT+0"),
                    "sender_fullname" => $current_user ? ("@" . $current_user->getUsername()) : null,
                    "sender_email" => $current_user ? $current_user->getEmail() : null
                ),
                    [Array("type" => "raw", "data" => $this->boardExport->generateIcs([$task->getAsArray()]), "filename" => "task.ics", "mimetype" => "text/board")]


                );
            }

        }


        //Notify connectors
        $resources = [];
        $done = [];
        foreach ($task->getWorkspacesBoards() as $board) {
            $workspace_id = $board["workspace_id"];
            if (!in_array($workspace_id, $done)) {
                $done[] = $workspace_id;
                $resources = array_merge($resources, $this->applications_api->getResources($workspace_id, "workspace_board", $workspace_id));
            }
        }
        $apps_ids = [];
        foreach ($resources as $resource) {
            if (in_array("task", $resource->getApplicationHooks())) {
                $apps_ids[] = $resource->getApplicationId();
            }
        }
        if (count($apps_ids) > 0) {
            foreach ($apps_ids as $app_id) {
                if ($app_id) {
                    $data = Array(
                        "task" => $task->getAsArray()
                    );
                    if ($did_create) {
                        $this->applications_api->notifyApp($app_id, "hook", "new_task", $data);
                    } else {
                        $this->applications_api->notifyApp($app_id, "hook", "edit_task", $data);
                    }
                }
            }
        }


        return $task->getAsArray();
    }

    //TODO Not the best to send update email every time, change it to a worker waiting 30 minutes at least
    private function hasRealChange($old_task, $new_task)
    {
        return ($old_task["from"] != $new_task["from"] || $old_task["to"] != $new_task["to"]
            || strlen(str_replace(" ", "", $old_task["title"] . "")) - strlen(trim($new_task["title"] . "")) > 10
            || strlen(str_replace(" ", "", $old_task["location"] . "")) - strlen(trim($new_task["location"] . "")) > 10
            || strlen(str_replace(" ", "", $old_task["description"] . "")) - strlen(trim($new_task["description"] . "")) > 10);
    }

    private function updateParticipants(Task $task, $participants = Array(), $replace_all = false)
    {
        $sort_key = $task->getSortKey();

        $participants = $participants ? $participants : [];

        $updated_participants = $this->formatArrayInput($participants, ["user_id_or_mail"]);
        $current_participants = $task->getParticipants();
        $updated_participants_fixed = $current_participants;

        $get_diff = $this->getArrayDiffUsingKeys($updated_participants, $current_participants, ["user_id_or_mail"]);

        if (count($get_diff["del"]) > 0 || $replace_all) {
            $users_in_task = $this->doctrine->getRepository("TwakeTasksBundle:TaskUser")->findBy(Array("task_id" => $task->getId()));
            foreach ($users_in_task as $user) {
                if (!$this->inArrayUsingKeys($get_diff["del"], Array("user_id_or_mail" => $user->getUserIdOrMail()), ["user_id_or_mail"]) || $replace_all) {
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
                    $mail_entity = $this->doctrine->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("mail" => $mail));
                    if ($mail_entity) {
                        $fixed_participant["user_id_or_mail"] = $mail_entity->getUser()->getId();
                    }
                } else if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                    //User id given
                    $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
                    if (!$user) {
                        continue;
                    }
                    $mail = $user->getEmail();
                } else {
                    continue;
                }

                $fixed_participant["email"] = $mail;
                $participant = $fixed_participant;

                $user = new TaskUser($participant["user_id_or_mail"], $task->getId(), $sort_date);
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

        $task->setParticipants($updated_participants_fixed);
        $this->doctrine->persist($task);

        $this->doctrine->flush();
    }

    private function updateBoards(Task $task, $boards = Array(), $replace_all = false)
    {
        $sort_key = $task->getSortKey();

        $boards = $boards ? $boards : [];

        $updated_boards = $this->formatArrayInput($boards, ["board_id", "workspace_id"]);
        $current_boards = $task->getWorkspacesBoards();
        $task->setWorkspacesBoards($updated_boards);
        $this->doctrine->persist($task);

        $get_diff = $this->getArrayDiffUsingKeys($updated_boards, $current_boards, ["board_id", "workspace_id"]);

        if (count($get_diff["del"]) > 0 || $replace_all) {
            $boards_in_task = $this->doctrine->getRepository("TwakeTasksBundle:TaskBoard")->findBy(Array("task_id" => $task->getId()));
            foreach ($boards_in_task as $board) {
                if (!$this->inArrayUsingKeys($get_diff["del"], ["board_id" => $board->getBoardId(), "workspace_id" => $board->getWorkspaceId()], ["board_id", "workspace_id"]) || $replace_all) {
                    //Remove old participants
                    $this->doctrine->remove($board);
                }
            }
        }

        foreach (($replace_all ? $updated_boards : $get_diff["add"]) as $board) {
            foreach ($sort_key as $sort_date) {
                $user = new TaskBoard($board["workspace_id"], $board["board_id"], $task->getId(), $sort_date);
                $this->doctrine->persist($user);
            }
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
