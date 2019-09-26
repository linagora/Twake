<?php

namespace WebsiteApi\TasksBundle\Services;


use WebsiteApi\TasksBundle\Entity\Board;
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
        $board_id = $options["board_id"];

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $tasks = $this->doctrine->getRepository("TwakeTasksBundle:Task")->findBy(Array("board_id" => $board_id));

        $ret = [];
        foreach ($tasks as $task) {
            $ret[] = $task->getAsArray();
        }

        //TODO get tasks by user or users

        return $ret;
    }

    public function remove($object, $options, $current_user = null)
    {
        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $board_task = $this->doctrine->getRepository("TwakeTasksBundle:Task")->findOneBy(Array("id" => $id));
        if (!$board_task) {
            return false;
        }

        $board = $this->doctrine->getRepository("TwakeTasksBundle:Board")->findOneBy(Array("id" => $board_task->getBoardId()));

        if (!$board_task->getArchived()) {
            $board->setActiveTasks($board->getActiveTasks() - 1);
        }
        $this->doctrine->persist($board);
        $this->doctrine->remove($board_task);
        $this->doctrine->flush();

        return $object;
    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        if (isset($object["id"]) && $object["id"]) {
            $task = $this->doctrine->getRepository("TwakeTasksBundle:Task")->findOneBy(Array("id" => $object["id"]));
            if (!$task) {
                return false;
            }
            $did_create = false;
        } else {
            $task = new Task($object["board_id"], $object["list_id"], $object["title"]);
            $task->setFrontId($object["front_id"]);
            $task->setOwner($current_user ? $current_user->getId() : null);
            $workspace_id = $this->doctrine->getRepository("TwakeTasksBundle:Board")->findOneBy(Array("id" => $object["board_id"]))->getWorkspaceId();
            $task->setWorkspaceId($workspace_id);
            $did_create = true;
        }

        /* @var Board $board */
        $board = $this->doctrine->getRepository("TwakeTasksBundle:Board")->findOneBy(Array("id" => $task->getBoardId()));

        //Manage infos
        if (isset($object["title"])) $task->setTitle($object["title"]);
        if (isset($object["description"])) $task->setDescription($object["description"]);
        if (isset($object["checklist"])) $task->setCheckList($object["checklist"]);

        if (isset($object["list_id"])) $task->setListId($object["list_id"]);
        if (isset($object["order"])) $task->setOrder($object["order"]);

        //Change active task count on board
        if (isset($object["archived"]) && !!$object["archived"] != $task->getArchived()) {
            //Changed archived status
            $task->setArchived($object["archived"]);
            if (!!$object["archived"]) {
                $board->setActiveTasks($board->getActiveTasks() - 1);
            } else {
                $board->setActiveTasks($board->getActiveTasks() + 1);
            }
            $this->doctrine->persist($board);
            $this->doctrine->flush();
        }
        if ($did_create) {
            $board->setActiveTasks($board->getActiveTasks() + 1);
            $this->doctrine->persist($board);
            $this->doctrine->flush();
        }

        $task->setTaskLastModified();

        if(isset($object["tags"])){
            $task->setTags($object["tags"]);
        }

        $this->doctrine->persist($task);
        $this->doctrine->flush();

        if ($did_create || $task->getNotifications() != $object["notifications"]) {
            $this->updateNotifications($task, $object["notifications"]);
        }

        if (isset($object["participants"]) || $did_create) {
            $this->updateParticipants($task, $object["participants"] ? $object["participants"] : Array());
        }

        //TODO notify participants for the "by user" task view

        //Notify connectors
        $resources = [];
        $workspace_id = $board->getWorkspaceId();
        $resources = array_merge($resources, $this->applications_api->getResources($workspace_id, "workspace_board", $workspace_id));
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

    private function updateParticipants(Task $task, $participants = Array())
    {

        $participants = $participants ? $participants : [];

        $updated_participants = $this->formatArrayInput($participants, ["user_id_or_mail"]);
        $current_participants = $task->getParticipants();
        $updated_participants_fixed = $current_participants;

        $get_diff = $this->getArrayDiffUsingKeys($updated_participants, $current_participants, ["user_id_or_mail"]);

        if (count($get_diff["del"]) > 0) {
            $users_in_task = $this->doctrine->getRepository("TwakeTasksBundle:TaskUser")->findBy(Array("task_id" => $task->getId()));
            foreach ($users_in_task as $user) {
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

            $user = new TaskUser($participant["user_id_or_mail"], $task->getId());
            $user->setEmail($mail);
            $this->doctrine->persist($user);

            $updated_participants_fixed[] = $participant;

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

    private function updateNotifications(Task $task, $notifications = Array())
    {

        if (!$task->getBefore() || $task->getBefore() < date("U")) {
            $notifications = Array();
        }

        $notifications = $notifications ? $notifications : [];

        $updated_notifications = $this->formatArrayInput($notifications, ["delay", "mode"]);
        $current_notifications = $task->getNotifications();
        $task->setNotifications($updated_notifications);
        $this->doctrine->persist($task);

        $get_diff = $this->getArrayDiffUsingKeys($updated_notifications, $current_notifications, ["delay", "mode"]);

        if (count($get_diff["del"]) > 0) {
            $notifications_in_task = $this->doctrine->getRepository("TwakeTasksBundle:TaskNotification")->findBy(Array("task_id" => $task->getId()));
            foreach ($notifications_in_task as $notification) {
                if (!$this->inArrayUsingKeys($get_diff["del"], ["delay" => $notification->getDelay(), "mode" => $notification->getMode()], ["mode", "delay"]) || $replace_all) {
                    //Remove old participants
                    $this->doctrine->remove($notification);
                }
            }
        }

        foreach (($replace_all ? $updated_notifications : $get_diff["add"]) as $notification) {
            $notification = new TaskNotification($task->getId(), $notification["delay"], $task->getBefore() - $notification["delay"], $notification["mode"]);
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


    public function checkReminders()
    {

        $when_ts_week = floor(date("U") / (7 * 24 * 60 * 60));

        $notifications = $this->doctrine->getRepository("TwakeTasksBundle:TaskNotification")->findRange(Array("when_ts_week" => $when_ts_week));//, "when_ts", date("U") - 60 * 60, date("U") + 60 * 45);

        foreach ($notifications as $notification) {

            if ($notification->getWhenTs() <= date("U") + 60 * 5) {
                //Send notification
                $task = $this->doctrine->getRepository("TwakeTasksBundle:Task")->findOneBy(Array("id" => $notification->getTaskId()));


                $delay = floor($notification->getDelay() / 60) . "min";
                if ($notification->getDelay() > 60 * 60) {
                    $delay = floor($notification->getDelay() / (60 * 60)) . "h";
                }
                if ($notification->getDelay() > 60 * 60 * 24) {
                    $delay = floor($notification->getDelay() / (60 * 60 * 24)) . "j";
                }
                if ($notification->getDelay() > 60 * 60 * 24 * 7 * 2) {
                    $delay = floor($notification->getDelay() / (60 * 60 * 24 * 7)) . "w";
                }

                $title = "Untitled";
                if ($task->getTitle()) {
                    $title = $task->getTitle();
                }
                $text = $title . " in " . $delay;

                $participants = $task->getParticipants();

                foreach ($participants as $participant) {
                    if ($notification->getMode() == "mail" || !$notification->getMode()) {
                        $mail = $participant["user_id_or_mail"];
                        $language = false;
                        if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                            $mail = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
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
                                $mail, "task_notification", Array(
                                    "_language" => $language ? $language : "en",
                                    "text" => $text,
                                    "delay" => $delay,
                                    "task" => $task->getAsArray()
                                )
                            );
                        }
                    }
                    if ($notification->getMode() == "push" || !$notification->getMode()) {
                        //Push notification
                        if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
                            if ($user) {
                                $this->notifications->pushDevice(
                                    $user, $text, "📋 Tasks notification"
                                );
                            }
                        }
                    }
                }

                //remove notification (we can remove it because it is stored in task cache anyway)
                $this->doctrine->remove($notification);
                $this->doctrine->flush();
            }
        }

    }

}
