<?php

namespace Twake\Tasks\Services;


use Twake\Core\CommonObjects\AttachementManager;
use Twake\Notifications\Entity\Notification;
use Twake\Tasks\Entity\Board;
use Twake\Tasks\Entity\Task;
use Twake\Tasks\Entity\TaskBoard;
use Twake\Tasks\Entity\TaskNotification;
use Twake\Tasks\Entity\TaskUser;
use App\App;

class BoardTask
{

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->boardExport = $app->getServices()->get("app.tasks.export");
        $this->enc_pusher = $app->getServices()->get("app.websockets");
        $this->applications_api = $app->getServices()->get("app.applications_api");
        $this->notifications = $app->getServices()->get("app.notifications");
        $this->attachementManager = new AttachementManager($this->doctrine, $this->enc_pusher);
        $this->queues_scheduled = $app->getServices()->get("app.queues_scheduled");
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
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

        if (explode("_", $board_id)[0] == "user") {
            $tasks = [];
            $user_id = explode("_", $board_id)[1];
            $workspaces = Array();
            if ($user_id != $current_user->getId() . "") {
                //Get available workspaces
                $workspaceUsers = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findBy(Array("user_id" => $user_id));
                foreach ($workspaceUsers as $wu) {
                    $available = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findBy(Array("user_id" => $current_user->getId(), "workspace_id" => $wu->getWorkspace($this->doctrine)->getId()));
                    if ($available) {
                        $workspaces[] = $wu->getWorkspaceId();
                    }
                }
            }
            $tasks_user = $this->doctrine->getRepository("Twake\Tasks:TaskUser")->findBy(Array("user_id_or_mail" => $user_id));
            $boardIsDeleted = [];
            foreach ($tasks_user as $taskuser) {
                $t = $this->doctrine->getRepository("Twake\Tasks:Task")->findOneBy(Array("id" => $taskuser->getTaskId()));
                if ($t) {

                    if(!isset($boardIsDeleted[$t->getBoardId()])){
                        $board = $this->doctrine->getRepository("Twake\Tasks:Board")->findOneBy(Array("id" => $t->getBoardId()));
                        $boardIsDeleted[$t->getBoardId()] = $board->getDeleted();
                    }

                    if(!$boardIsDeleted[$t->getBoardId()]){

                        if ($user_id != $current_user->getId() . "") {
                            $ok = false;
                            foreach ($workspaces as $workspace_id) {
                                if ($workspace_id == $t->getWorkspaceId()) {
                                    $ok = true;
                                    break;
                                }
                            }
                        } else {
                            $ok = true;
                        }
                        if ($ok) $tasks[] = $t;

                    }
                } else {
                    $this->doctrine->remove($taskuser);
                    $this->doctrine->flush();
                }
            }
        } else {
            $tasks = $this->doctrine->getRepository("Twake\Tasks:Task")->findBy(Array("board_id" => $board_id));
        }

        $ret = [];
        foreach ($tasks as $task) {
            $ret[] = $task->getAsArray();
        }

        return $ret;
    }

    public function remove($object, $options, $current_user = null)
    {
        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $board_task = $this->doctrine->getRepository("Twake\Tasks:Task")->findOneBy(Array("id" => $id));
        if (!$board_task) {
            return false;
        }

        $board = $this->doctrine->getRepository("Twake\Tasks:Board")->findOneBy(Array("id" => $board_task->getBoardId()));

        if (!$board_task->getArchived()) {
            $board->setActiveTasks($board->getActiveTasks() - 1);
        }
        $this->attachementManager->removeAttachementsFromEntity($board_task);
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
            $task = $this->doctrine->getRepository("Twake\Tasks:Task")->findOneBy(Array("id" => $object["id"]));
            if (!$task) {
                return false;
            }
            $did_create = false;
        } else {
            $task = new Task($object["board_id"], $object["list_id"], $object["title"]);
            $task->setFrontId($object["front_id"]);
            $task->setOwner($current_user ? $current_user->getId() : null);
            $workspace_id = $this->doctrine->getRepository("Twake\Tasks:Board")->findOneBy(Array("id" => $object["board_id"]))->getWorkspaceId();
            $task->setWorkspaceId($workspace_id);
            $did_create = true;
        }

        /* @var Board $board */
        $board = $this->doctrine->getRepository("Twake\Tasks:Board")->findOneBy(Array("id" => $task->getBoardId()));

        /* @var \Twake\Tasks\Entity\BoardList $list */
        $list = $this->doctrine->getRepository("Twake\Tasks:BoardList")->findOneBy(Array("id" => $task->getListId()));

        if ($did_create) {
            if (!isset($object["participants"]) || !$object["participants"]) {
                $object["participants"] = [];
            }
            foreach ($list->getAutoParticipants() as $participant) {
                if (is_string($participant)) {
                    $participant = Array(
                        "user_id_or_mail" => $participant
                    );
                }
                $object["participants"][] = $participant;
            }
        }

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

        if (isset($object["tags"])) {
            $task->setTags($object["tags"]);
        }

        $this->doctrine->persist($task);
        $this->doctrine->flush();

        if ($did_create || $task->getNotifications() != $object["notifications"] || $task->getBefore() != $object["before"] || $task->getStartTime() != $object["start"]) {
            $change_dates = $did_create || $task->getBefore() != $object["before"] || $task->getStartTime() != $object["start"];
            if (isset($object["before"])) $task->setBefore(intval($object["before"]));
            if (isset($object["start"])) $task->setStartTime(intval($object["start"]));
            $this->updateNotifications($task, $object["notifications"], $change_dates);
        }

        if (isset($object["participants"]) || $did_create) {
            $this->updateParticipants($task, $object["participants"] ? $object["participants"] : Array());
        }

        if (isset($object["attachments"]) || $did_create) {
            $this->attachementManager->updateAttachements($task, $object["attachments"] ? $object["attachments"] : Array());
        }

        foreach ($task->getParticipants() as $participant) {
            if (!is_string($participant)) {
                $participant = $participant["user_id_or_mail"];
            }
            $ws_events = Array(
                "client_id" => "system",
                "action" => "save",
                "object_type" => "",
                "object" => $task->getAsArray()
            );
            $this->enc_pusher->push("board_tasks/user_" . $participant, $ws_events);
        }


        //Notify connectors
        $resources = [];
        $workspace_id = $board->getWorkspaceId();
        $resources = array_merge($resources, $this->applications_api->getResources($workspace_id, "workspace_tasks", $workspace_id));
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

    private function updateNotifications(Task $task, $notifications = Array(), $replace_all = false)
    {

        $notifications = $notifications ? $notifications : [];
        $token = base64_encode(bin2hex(random_bytes(32)));

        foreach ($notifications as $index => $notification) {
            $notifications[$index]["token"] = $token;
        }

        $has_before = true;
        if (!$task->getBefore() || $task->getBefore() < date("U")) {
            $has_before = false;
            $notifications = Array();
        }

        $updated_notifications = $this->formatArrayInput($notifications, ["delay", "mode"]);
        $task->setNotifications($updated_notifications);
        $this->doctrine->persist($task);

        if ($task->getBefore() > 0 && $replace_all) {
            //Add deadline
            $updated_notifications[] = Array(
                "delay" => 0,
                "mode" => "push",
                "token" => $token
            );
        }

        if ($task->getStartTime() > 0 && $task->getStartTime() > date("U") && $replace_all) {
            //Add start time as notification
            $updated_notifications[] = Array(
                "delay" => $has_before ? ($task->getBefore() - $task->getStartTime()) : ($task->getStartTime()),
                "mode" => "push",
                "token" => $token
            );
        }

        $this->doctrine->flush();

        foreach ($updated_notifications as $notification) {
            if ($has_before) {
                $notification_date = $task->getBefore() - $notification["delay"];
                $delay = $notification["delay"];
            } else {
                $notification_date = $notification["delay"];
                $delay = "0";
            }

            if ($notification_date < date("U")) {
                continue;
            }

            $this->queues_scheduled->schedule("tasks_task", $notification_date, [
                "token" => $token,
                "task_id" => $task->getId(),
                "delay" => $delay,
                "mode" => $notification["mode"]
            ]);
        }

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

    private function updateParticipants(Task $task, $participants = Array())
    {

        $participants = $participants ? $participants : [];

        $updated_participants = $this->formatArrayInput($participants, ["user_id_or_mail"]);
        $current_participants = $task->getParticipants();
        $updated_participants_fixed = $current_participants;

        $get_diff = $this->getArrayDiffUsingKeys($updated_participants, $current_participants, ["user_id_or_mail"]);

        if (count($get_diff["del"]) > 0) {
            $users_in_task = $this->doctrine->getRepository("Twake\Tasks:TaskUser")->findBy(Array("task_id" => $task->getId()));
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
                $mail_entity = $this->doctrine->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => $mail));
                if ($mail_entity) {
                    $fixed_participant["user_id_or_mail"] = $mail_entity->getUser()->getId();
                }
            } else if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                //User id given
                $user = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
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

    public function updateAttachements(Task $task, $attachements = Array())
    {
        $oldAttachements = $task->getAttachements() ? $task->getAttachements() : Array();
        $newAttachement = $oldAttachements;
        $get_diff = $this->getArrayDiffUsingKeys($attachements, $oldAttachements, ["id"]);
        foreach ($get_diff["del"] as $att) {
            foreach ($newAttachement as $index => $attac) {
                if ($attac["id"] == $att["id"] && $attac["type"] == $att["type"]) {
                    $attachedRepo = $this->getAttachementRepository($att["type"]);
                    if ($attachedRepo) {
                        $entityAttached = $attachedRepo->findOneBy(Array("id" => $att["id"]));
                        $attachmentInEntityAttached = $entityAttached->getAttachements();
                        foreach ($attachmentInEntityAttached as $index1 => $attac1) {
                            if ($attac1["id"] == $task->getId() && $attac1["type"] == "task" && $attac1["isAtttached"]) {
                                unset($attachmentInEntityAttached[$index1]);
                                $entityAttached->setAttachements($attachmentInEntityAttached);
                                $this->doctrine->persist($entityAttached);
                                break;
                            }
                        }
                    }
                    unset($newAttachement[$index]);
                }
            }
        }
        foreach ($get_diff["add"] as $att) {
            $att["isAttached"] = false;
            $newAttachement[] = $att;
            $attachedRepo = $this->getAttachementRepository($att["type"]);
            if ($attachedRepo) {
                $entityAttached = $attachedRepo->findOneBy(Array("id" => $att["id"]));
                if ($entityAttached) {
                    $attachmentInEntityAttached = $entityAttached->getAttachements();
                    $attachmentOfAttached = Array(
                        "type" => "task",
                        "id" => $task->getId(),
                        "name" => $task->getTitle(),
                        "isAttached" => true
                    );
                    $attachmentInEntityAttached[] = $attachmentOfAttached;
                    $entityAttached->setAttachements($attachmentInEntityAttached);
                    $this->doctrine->persist($entityAttached);
                }
            }
        }
        $task->setAttachements($newAttachement);
        $this->doctrine->persist($task);
        $this->doctrine->flush();
    }

    public function getAttachementRepository($type)
    {
        if ($type == "file") {
            return $this->doctrine->getRepository("Twake\Drive:DriveFile");
        } elseif ($type == "task") {
            return $this->doctrine->getRepository("Twake\Tasks:Task");
        } elseif ($type == "event") {
            return $this->doctrine->getRepository("Twake\Calendar:Event");
        }
        return false;
    }

    public function checkReminders()
    {
        $sent = 0;

        $notifications = $this->queues_scheduled->consume("tasks_task", true);

        foreach ($notifications ?: [] as $notification_original) {

            $notification = $this->queues_scheduled->getMessage($notification_original);

            //Send notification
            $task = $this->doctrine->getRepository("Twake\Tasks:Task")->findOneBy(Array("id" => $notification["task_id"]));

            if ($task) {

                $existing_notifications = $task->getNotifications();
                $valid_notification = false;
                foreach ($existing_notifications as $existing_notification) {
                    //Verify this received notification exists in calendar event
                    if ($existing_notification["token"] == $notification["token"]) {
                        $valid_notification = true;
                    }
                }

                if ($valid_notification) {

                    $is_deadline = false;
                    if ($task->getBefore() && abs($task->getBefore() - (date("U") + $notification["delay"])) < 60) {
                        $is_deadline = true;
                    }

                    if (!$task->getArchived()) {

                        $delay = floor($notification["delay"] / 60) . "min";
                        if ($notification["delay"] > 60 * 60) {
                            $delay = floor($notification["delay"] / (60 * 60)) . "h";
                        }
                        if ($notification["delay"] > 60 * 60 * 24) {
                            $delay = floor($notification["delay"] / (60 * 60 * 24)) . "j";
                        }
                        if ($notification["delay"] > 60 * 60 * 24 * 7 * 2) {
                            $delay = floor($notification["delay"] / (60 * 60 * 24 * 7)) . "w";
                        }

                        $title = "Untitled";
                        if ($task->getTitle()) {
                            $title = $task->getTitle();
                        }
                        $text = $title . ($is_deadline ? " (deadline)" : "") . ($delay > 0 ? (" in " . $delay) : "");

                        $participants = $task->getParticipants();

                        foreach ($participants as $participant) {
                            if ($notification["mode"] == "mail" || !$notification["mode"]) {
                                $mail = $participant["user_id_or_mail"];
                                $language = false;
                                if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                                    $mail = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
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
                            if ($notification["mode"] == "push" || !$notification["mode"]) {
                                //Push notification
                                if (preg_match('/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/', $participant["user_id_or_mail"])) {
                                    $user = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $participant["user_id_or_mail"]));
                                    if ($user) {
                                        $this->notifications->pushDevice(
                                            $user, $text, "📋 Tasks notification", null, Array(
                                            )
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }


            $sent++;
            $this->queues_scheduled->ack("tasks_task", $notification_original);

        }

        return $sent;

    }

}
