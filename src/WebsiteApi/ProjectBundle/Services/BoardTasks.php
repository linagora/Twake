<?php


namespace WebsiteApi\ProjectBundle\Services;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\ObjectLinksBundle\Services\ObjectLinksSystem;
use WebsiteApi\ProjectBundle\Entity\Board;
use WebsiteApi\ProjectBundle\Entity\BoardTask;
use WebsiteApi\ProjectBundle\Entity\LinkBoardWorkspace;
use WebsiteApi\ProjectBundle\Entity\LinkTaskUser;
use WebsiteApi\ProjectBundle\Entity\ListOfTasks;
use WebsiteApi\ProjectBundle\Model\BoardTasksInterface;
use WebsiteApi\WorkspacesBundle\Services\WorkspacesActivities;

/**
 * Manage board
 */
class BoardTasks implements BoardTasksInterface
{

    var $doctrine;
    var $pusher;
    var $workspaceLevels;
    var $notifications;
    /* @var BoardActivities $boardActivities */
    var $boardActivities;
    /* @var ObjectLinksSystem $objectLinksSystem*/
    var $objectLinksSystem;
    /* @var WorkspacesActivities $workspacesActivities*/
    var $workspacesActivities;

    public function __construct($doctrine, $pusher, $workspaceLevels, $notifications, $serviceBoardActivity, $objectLinksSystem, $workspacesActivities, $calendarEventsService)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
        $this->notifications = $notifications;
        $this->boardActivities = $serviceBoardActivity;
        $this->objectLinksSystem = $objectLinksSystem;
        $this->workspacesActivities = $workspacesActivities;
        $this->calendarEventsService = $calendarEventsService;
    }

    private function notifyParticipants($participants, $workspace, $title, $description, $notifCode, $currentUserId = null)
    {
        foreach ($participants as $participant){
            $user = $this->convertToEntity($participant,"TwakeUsersBundle:User");
            if ($currentUserId != $user->getId()) {
                $this->boardActivities->pushActivity(true, $workspace, $user, null, $title, $description, Array(), Array("notifCode" => $notifCode));
            }
        }
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function createTask($listId, $taskArray, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId = null, $userIdsToNotify = Array(), $participants = Array(), $weight = 1, $labels = Array(), $status = "todo")
    {
        /* @var ListOfTasks $list */
        $list = $this->convertToEntity($listId,"TwakeProjectBundle:ListOfTasks");
        $workspace = $this->getWorkspaceFromBoard($list->getBoard());
        $user = $this->convertToEntity($currentUserId,"TwakeUsersBundle:User");

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:write")) {
            return null;
        }

        $board = $list->getBoard();

        //$from, $to, $name, $description, $dependingTask, $weight
        if($dependingTaskId!=0)
            $dependingTask = $this->convertToEntity($dependingTaskId,"TwakeProjectBundle:BoardTask");
        else
            $dependingTask = null;

        $task = new BoardTask($startDate, $endDate, $name, $description, $dependingTask,$participants,$user, $weight);

        $task->setUserIdToNotify($userIdsToNotify);
        $task->setParticipants($participants);
        $task->setOrder($this->getMinOrder($board)-1);
        $task->setLabels($labels);
        $task->setStatus($status);
        $task->setWorkspace($workspace);

        $task->setListOfTasks($list);
        $task->setBoard($board);

        $this->doctrine->persist($task);
        $this->doctrine->flush();

        if (!$board->getisPrivate()) {
            $this->workspacesActivities->recordActivity($workspace, $user, "tasks", "workspace.activity.task.create", "TwakeProjectBundle:BoardTask", $task->getId());
        }
        $this->notifyParticipants($task->getAllUsersToNotify(), $workspace, "Task " . $task->getName() . " updated", "", $board->getId() . "/" . $task->getId(), $currentUserId);

        return $task;

    }
    public function likeTask($taskId, $userId, $like){
        /* @var BoardTask $task */

        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);
        if($like)
            $task->likeOne($userId);
        else
            $task->dislikeOne($userId);

        $this->doctrine->persist($task);
        $this->doctrine->flush($task);

        return $task->getLike();
    }

    public function updateTask($taskId, $taskArray, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId, $userToNotify, $participants, $weight, $labels, $status, $checklist)
    {
        /* @var BoardTask $task */
        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);

        if(!$task){
            return null;
        }
        $workspace = $this->getWorkspaceFromTask($taskId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:write")) {
            return null;
        }

        $board = $task->getBoard();

        $this->updateUsers($task, $participants, false);

        if($name!=null)
            $task->setName($name);
        if ($description !== null)
            $task->setDescription($description);
        if($weight!=null)
            $task->setWeight($weight);
        if ($labels !== null)
            $task->setLabels($labels);
        if($board!=null)
            $task->setBoard($board);
        if ($participants !== null)
            $task->setParticipants($participants);
        if ($userToNotify !== null)
            $task->setUserIdToNotify($userToNotify);
        if ($startDate !== null)
            $task->setFrom($startDate);
        if ($endDate !== null)
            $task->setTo($endDate);
        if ($status !== null)
            $task->setStatus($status);
        if ($checklist !== null)
            $task->setChecklist($checklist);

        $this->doctrine->persist($task);

        $this->doctrine->flush();

        $data = Array(
            "type" => "update",
            "task" => $task->getAsArray()
        );

        $links = $this->objectLinksSystem->updateObject($task);
        foreach ($links as $link) {
            if ($link && $link["object"] && $link["type"] == "TwakeCalendarBundle:CalendarEvent") {
                $this->calendarEventsService->updateUsersFromArray($workspace->getId(), $link["object"]->getId(), $currentUserId);
            }
        }

        if (!$board->getisPrivate()) {
            $this->workspacesActivities->recordActivity($workspace, $currentUserId, "tasks", "workspace.activity.task.update", "TwakeProjectBundle:BoardTask", $task->getId());
        }

        $this->notifyParticipants($task->getAllUsersToNotify(), $workspace, "Task " . $task->getName() . " updated", "Task " . $task->getName() . " updated", $board->getId() . "/" . $taskId, $currentUserId);
        

        return $task;
    }

    public function removeTask($taskId, $currentUserId = null)
    {
        $workspace = $this->getWorkspaceFromTask($taskId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:write")) {
            return null;
        }


        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);
        $board = $task->getBoard();

        $usersLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findBy(Array("task"=>$task));
        foreach ($usersLinked as $userLinked){
            $this->doctrine->remove($userLinked);
        }

        $this->objectLinksSystem->deleteObject($task);
        $this->doctrine->remove($task);
        $this->doctrine->flush();

        $data = Array(
            "type" => "remove",
            "task_id" => $taskId
        );


        if (!$board->getisPrivate()) {
            $this->workspacesActivities->recordActivity($workspace, $currentUserId, "tasks", "workspace.activity.task.remove", "TwakeProjectBundle:BoardTask", $task->getId());
        }
        $this->notifyParticipants($task->getAllUsersToNotify(), $workspace, "Task " . $task->getName() . " deleted", "", $board->getId() . "/" . $taskId, $currentUserId);

        return true;
    }

    public function moveTask($idsOrderMap, $listId, $boardId, $currentUserId)
    {
        /* @var Board $board */
        $board = $this->convertToEntity($boardId,"TwakeProjectBundle:Board");
        $workspace = $this->getWorkspaceFromBoard($board);
        /* @var ListOfTasks $list */
        $list = $this->convertToEntity($listId,"TwakeProjectBundle:ListOfTasks");
        foreach ($idsOrderMap as $id => $order){
            /* @var BoardTask $task */
            $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findOneBy(Array("id" => $id, "board" => $board));
            if($task==null)
                continue;


            $task->setListOfTasks($list);
            $task->setOrder($order);

            /*
            $wasInDone = $task->getListOfTasks()->getisDoneList();

            $task->setListOfTasks($list);
            $task->setOrder($order);
            if ($task->getDoneDate() == null) {
                $task->setDoneDate($list->getisDoneList() ? new \DateTime() : null);
            }

            if ($list->getisDoneList() && !$wasInDone && !$board->getisPrivate()) {
                $this->workspacesActivities->recordActivity($workspace, $currentUserId, "tasks", "workspace.activity.task.done", "TwakeProjectBundle:BoardTask", $task->getId());
            }*/

            $this->doctrine->persist($task);
        }

        $this->doctrine->flush();

        return true;
    }

    private function getWorkspaceFromBoard($boardId){
        /* @var Board $board*/
        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        /* @var LinkBoardWorkspace $linkBoardWorkspace*/
        $linkBoardWorkspace = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board" => $board));
        return $linkBoardWorkspace->getWorkspace();
    }

    private function updateUsers($task, $usersIds, $flush = true)
    {

        $oldUsers = $task->getParticipants();

        if ($usersIds !== null) {
            $task->setParticipants($usersIds);
        }

        $new_users = array_diff($usersIds, $oldUsers);
        $to_remove_users = array_diff($oldUsers, $usersIds);

        foreach ($new_users as $userId) {
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
            $userLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findOneBy(Array("user" => $user, "task" => $task));
            if (!$userLinked) {
                $userLinked = new LinkTaskUser($user, $task);
                $this->doctrine->persist($userLinked);
            }
        }

        foreach ($to_remove_users as $userId) {
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
            $userLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findOneBy(Array("user"=>$user, "task"=>$task));
            if ($userLinked) {
                $this->doctrine->remove($userLinked);
            }
        }

        if ($flush) {
            $this->doctrine->flush();
        }

    }

    public function getParticipantsAsUser($task){
        /* @var BoardTask $task */
        $task = $this->convertToEntity($task,"TwakeProjectBundle:BoardTask");
        $participants = $task->getParticipants();
        $final = [];


        foreach ($participants as $participant) {
            $final[] = $this->convertToEntity($participant,"TwakeUsersBundle:User");
        }

        return $final;
    }
    public function getUserToNotifyAsUser($task){
        $task = $this->convertToEntity($task,"TwakeProjectBundle:BoardTask");
        $usersToNotify = $task->getUserIdToNotify();
        $final = [];

        foreach ($usersToNotify as $userToNotify) {
            $final[] = $this->convertToEntity($userToNotify,"TwakeUsersBundle:User");
        }

        return $final;
    }

    public function getTasks($boardId, $currentUserId = null)
    {
        $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read"))) {
            return null;
        }

        $board = $this->convertToEntity($boardId,"TwakeProjectBundle:Board");

        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("board" => $board));

        return $tasks;
    }

    public function getTasksForUser($workspaceId, $userId, $currentUserId = null)
    {

        if ($userId == $currentUserId) {
            $currentUserId = null; //Give root rights for ourselves
        }

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read")) {
            return null;
        }

        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
        $tasksLinks = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findBy(Array("user" => $user));

        $tasks = Array();
        $boards = Array();
        $workspacesId = Array();

        foreach ($tasksLinks as $taskLink) {

            $task = $taskLink->getTask();
            $board = $task->getBoard();

            $auth = !$currentUserId;

            if ($currentUserId && !isset($boards[$board->getId()])) {

                if ($board->getisPrivate()) {

                    foreach ($board->getParticipants() as $participant) {
                        if ($participant == $userId) {
                            $auth = true;
                            break;
                        }
                    }

                } else {

                    $links = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("board" => $board->getId()));

                    foreach ($links as $workspace_link) {
                        /* @var Workspace $workspace */
                        $workspace = $workspace_link->getWorkspace();

                        if (!isset($workspacesId[$workspace->getId()])) {
                            if ($this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read")) {
                                $auth = true;
                                $workspacesId[$workspace->getId()] = true;
                                break;
                            } else
                                $workspacesId[$workspace->getId()] = false;
                        } else {
                            $auth = $workspacesId[$workspace->getId()];
                            if ($auth)
                                break;
                        }
                    }

                    $boards[$board->getId()] = $auth;

                }

            } else if ($currentUserId) {
                $auth = $boards[$board->getId()];
            }

            if ($auth) {
                $tasks[] = $task->getAsArray();
            } else {
                $tasks[] = $task->getAsMinimalArray();
            }

        }

        return $tasks;

    }

    public function getTask($taskId, $currentUserId){
        $workspace = $this->getWorkspaceFromTask($taskId);

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read"))) {
            return null;
        }

        /* @var BoardTask $task*/
        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findOneBy(Array("id"=>$taskId));
        if($task==null)
            return false;
        /* @var LinkBoardWorkspace $workspaceLink*/
        $workspaceLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$task->getBoard()));

        if(!$workspaceLink)
            return false;

        if($workspaceLink->getWorkspace()->getId()==$workspace->getId())
            return $task;

        return false;
    }

    public function getTasksByBoard($workspaceId, $boardsId, $currentUserId = null){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));
        var_dump($workspaceId);
        var_dump($boardsId);
        if($workspace == null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read"))){
            return null;
        }
        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->getAllBoardTasksByBoard($boardsId);

        foreach ($tasks as $link) {
            $evt = $link->getAsArray();

            $result[] = $evt;
        }

        return $result;
    }

    public function getTaskById($workspaceId, $taskId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read")) {
            return null;
        }

        if($workspace==null ){
            return null;
        }

        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);
        if(!$task){
            return null;
        }else{

            $task = $task->getAsArray();

        }


        return $task;
    }

    public function getUsers( $taskId, $currentUserId = null)
    {
        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);

        if(!$task ){
            return null;
        }

        $taskUserRepo = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser");
        $users = Array();
        $taskUsers = $taskUserRepo->findBy(Array("task"=>$task));

        foreach ($taskUsers as $user){
            $users[] = $user->getUser()->getAsArray();
        }

        return $users;

    }

    /** Check all tasks that have to be reminded */
    public function checkReminders()
    {

        /** @var BoardTask[] $tasks */
        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->toRemind();
        $linkRepo = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser");

        $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "board"));

        foreach ($tasks as $task) {

            $date = $task->getFrom();
            $in = $date - date("U");
            $in = $in / 60;
            if ($in < 60) {
                $in = intval($in) . " minute(s) ";
            } else if ($in / 60 < 24) {
                $in = intval($in / 60) . " hour(s) ";
            } else {
                $in = intval($in / (60 * 24)) . " day(s) ";
            }

            $title = "Task";
            if (isset($task->getTask()["title"])) {
                $title = $task->getTask()["title"];
            }
            $text = $title . " in " . $in;

            $_users = $linkRepo->findBy(Array("task" => $task));
            if (count($_users) > 0) {
                $users = Array();
                foreach ($_users as $user) {
                    $users[] = $user->getUser()->getId();
                }
                $this->notifications->pushNotification($app, null, $users, null, "task_" . $task->getId(), $text, Array("push"), null, false);
            }


            $task->setNextReminder(0);
            $this->doctrine->persist($task);

        }

        $this->doctrine->flush();
        return true;
    }

    public function moveTaskToList($taskId, $listOfTasksId, $workspaceId = 0, $currentUserId = null)
    {
        $boardTaskRepository = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask");
        $listOfTasksRepository = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks");

        /* @var \WebsiteApi\ProjectBundle\Entity\BoardTask $task */
        $task = $boardTaskRepository->findOneBy(Array("id" => $taskId));
        /* @var \WebsiteApi\ProjectBundle\Entity\ListOfTasks $listofTasks */
        $listOfTasks = $listOfTasksRepository->findOneBy(Array("id" => $listOfTasksId));

        $board = $task->getBoard();
        $task->setListOfTasks($listOfTasks);

        $this->doctrine->persist($task);
        $this->doctrine->flush();
        $this->notifyParticipants($task->getAllUsersToNotify(), $workspaceId, "Task " . $task->getName() . " moved", "", $board->getId() . "/" . $taskId, $currentUserId);
    }

    public function moveTaskToBoard($taskId, $boardId, $workspaceId = 0, $currentUserId = null)
    {
        $boardTaskRepository = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask");
        $boardRepository = $this->doctrine->getRepository("TwakeProjectBundle:Board");

        /* @var \WebsiteApi\ProjectBundle\Entity\BoardTask $task */
        $task = $boardTaskRepository->findOneBy(Array("id" => $taskId));

        /* @var \WebsiteApi\ProjectBundle\Entity\Board $board */
        $board = $boardRepository->findOneBy(Array("id" => $boardId));

        if($task!=null && $board!=null) {
            $task->setBoard($board);

            $this->doctrine->persist($task);
            $this->doctrine->flush();
            $this->notifyParticipants($task->getAllUsersToNotify(), $workspaceId, "Task " . $task->getName() . " moved", "", $board->getId() . "/" . $taskId, $currentUserId);
        }
    }

    public function updateDependentTask($taskId, $taskIdToDependentOf){
        $boardTaskRepository = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask");

        /* @var \WebsiteApi\ProjectBundle\Entity\BoardTask $task */
        $task = $boardTaskRepository->findOneBy(Array("id" => $taskId));
        $taskToDependentOf = $boardTaskRepository->findOneBy(Array("id" => $taskIdToDependentOf));

        $task->setDependingTask($taskToDependentOf);
    }

    public function getTaskByNameOrDescription($name, $description){
        $boardTaskRepository = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask");

        $taskName = $boardTaskRepository->findBy(Array("name"));
        $taskDescription = $boardTaskRepository->findBy(Array("description"));

        return array_unique(array_merge($taskName,$taskDescription), SORT_REGULAR);
    }

    private function getWorkspaceFromTask($taskId)
    {
        /* @var BoardTask $task */
        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findOneBy(Array("id" => $taskId));

        return $this->getWorkspaceFromBoard($task->getBoard()->getId());
    }
    private function getMinOrder($board)
    {
        $board = $this->convertToEntity($board,"TwakeProjectBundle:Board");

        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("board" => $board));

        $m = 0;
        foreach ($tasks as $list){
            if($list->getOrder()<$m)
                $m = $list->getOrder();
        }
        return $m;
    }
}