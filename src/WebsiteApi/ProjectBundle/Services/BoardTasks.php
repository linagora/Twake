<?php


namespace WebsiteApi\ProjectBundle\Services;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\ProjectBundle\Entity\Board;
use WebsiteApi\ProjectBundle\Entity\BoardTask;
use WebsiteApi\ProjectBundle\Entity\LinkBoardWorkspace;
use WebsiteApi\ProjectBundle\Entity\LinkTaskUser;
use WebsiteApi\ProjectBundle\Model\BoardTasksInterface;

/**
 * Manage board
 */
class BoardTasks implements BoardTasksInterface
{

    var $doctrine;
    var $pusher;
    var $workspaceLevels;
    var $notifications;
    /* @var BoardActivities $boardActivity */
    var $boardActivity;

    public function __construct($doctrine, $pusher, $workspaceLevels, $notifications, $serviceBoardActivity)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
        $this->notifications = $notifications;
        $this->boardActivity = $serviceBoardActivity;
    }

    private function notifyParticipants($participants, $workspace, $title, $description, $notifCode){
        foreach ($participants as $participant){
            $user = $this->convertToEntity($participant,"TwakeUsersBundle:User");
            $this->boardActivities->pushActivity(true,$workspace,$user,null,$title,$description,Array(),Array("notifCode" => $notifCode));
        }
    }

    public function createTask($boardId, $task, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId = null, $addMySelf = false, $userIdsToNotify=Array(), $weight=1)
    {
        $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        if(!isset($task["from"]) || !isset($task["to"])){
            return null;
        }

        //$from, $to, $name, $description, $dependingTask, $weight
        if($dependingTaskId!=0)
            $dependingTask = $this->convertToEntity($dependingTaskId,"TwakeProjectBundle:BoardTask");
        else
            $dependingTask = null;
        $task = new BoardTask($startDate, $endDate, $name, $description, $dependingTask, $weight);

        $task->setBoard($board);
        $task->setUserIdToNotify($userIdsToNotify);
        $task->setOrder($this->getMinOrder($board));

        $this->doctrine->persist($task);
        $this->doctrine->flush();

        $data = Array(
            "type" => "create",
            "task" => $task->getAsArray()
        );
        $this->pusher->push($data, "board/".$boardId);
        $this->doctrine->flush();
        $this->notifyParticipants($userIdsToNotify,$workspace,"","","");

        return $task;

    }

    public function updateTask($workspaceId, $boardId, $taskId, $taskArray, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        if(!isset($taskArray["from"]) || !isset($taskArray["to"])){
            return null;
        }


        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);

        if(!$task){
            return null;
        }

        //If we changed board verify that old board is our board
        if($task->getBoard()->getId() != $boardId){
            $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $task->getBoard()));
            if(!$boardLink){
                return null;
            }
        }

        /* @var BoardTask $task */

        $task->setBoard($board);
        $task->setTask($taskArray);
        $task->setFrom($taskArray["from"]);
        $task->setTo($taskArray["to"]);
        $task->setUserIdToNotify($taskArray["participant"]);
        if (isset($taskArray["reminder"])) {
            $task->setReminder(intval($taskArray["reminder"]));
        } else {
            $task->setReminder();
        }
        $this->doctrine->persist($task);

        $usersLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findBy(Array("task"=>$task));
        foreach ($usersLinked as $userLinked){
            $userLinked->setFrom($task->getFrom());
            $userLinked->setTo($task->getTo());
            $this->doctrine->persist($userLinked);
        }

        $this->doctrine->flush();

        $data = Array(
            "type" => "update",
            "task" => $task->getAsArray()
        );

        $this->notifyParticipants($board->getParticipants(),$workspace, "Task ".$task->getName()." updated", "", "");
        $this->notifyParticipants($task->getParticipants(),$workspace, "Task ".$task->getName()." updated", "", "");
        $this->pusher->push($data, "board/".$boardId);

        return $task;
    }

    public function removeTask($workspaceId, $boardId, $taskId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);

        if(!$task || $task->getBoard()->getId() != $boardId){
            return null;
        }

        $usersLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findBy(Array("task"=>$task));
        foreach ($usersLinked as $userLinked){
            $this->doctrine->remove($userLinked);
        }

        $this->doctrine->remove($task);
        $this->doctrine->flush();

        $data = Array(
            "type" => "remove",
            "task_id" => $taskId
        );
        $this->pusher->push($data, "board/".$boardId);
        $this->notifyParticipants($board->getParticipants(),$workspace, "Task ".$task->getName()." deleted", "", "");
        $this->notifyParticipants($task->getParticipants(),$workspace, "Task ".$task->getName()." deleted", "", "");

        return true;
    }

    public function moveTask($idsOrderMap)
    {
        foreach ($idsOrderMap as $id => $order){
            /* @var BoardTasks $task */
            $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTasks")->findOneBy(Array("id" => $id));
            if($task==null)
                continue;
            $task->setOrder($order);
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


    public function addUsers($workspaceId, $boardId, $task, $usersId, $currentUserId = null)
    {
        $taskId = null;
        if(is_int($task) || is_string($task))
            $taskId = $task;
        error_log("ADD USERS");
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        if($taskId!=null)
            $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);

        if(!$task || $task->getBoard()->getId() != $boardId){
            return null;
        }

        /* @var BoardTask $task */

        foreach ($usersId as $userId) {
            if($userId != null){ //pour eviter un bug du front
                $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
                $taskUserRepo = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser");
                $userLink = $taskUserRepo->findBy(Array("user"=>$user,"task"=>$task));
                if($userLink== false){
                    $userLinked = new LinkTaskUser($user, $task);
                    $userLinked->setFrom($task->getFrom());
                    $userLinked->setTo($task->getTo());
                    $this->doctrine->persist($userLinked);
                    $participantArray = $task->getUserIdToNotify();
                    $participantArray[] = $user->getId();
                }
                $this->boardActivity->pushActivity(true, $workspaceId, $user, null, "Added  to ".$task->getName(),"", Array(), Array("notifCode" => ""));
            }
        }
        $task->setUserIdToNotify($participantArray);
        $this->doctrine->flush();
        $data = Array(
            "type" => "update",
            "task" => $task->getAsArray()
        );
        $this->pusher->push($data, "board/".$boardId);
        return true;

    }

    public function removeUsers($workspaceId, $boardId, $taskId, $usersId, $currentUserId = null)
    {

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);

        if(!$task || $task->getBoard()->getId() != $boardId){
            return null;
        }


        $participantArray = $task->getParticipant();
        foreach ($usersId as $userId){
            error_log("remove ".$userId);
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
            $userLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findOneBy(Array("user"=>$user, "task"=>$task));
            $this->doctrine->remove($userLinked);
            for($i=0;$i<count($participantArray);$i++){
                if($participantArray[$i] == $user->getId()){
                    error_log("remove from array ".$i.", ".json_encode($participantArray));
                    unset($participantArray[$i]);
                    $participantArray = array_values($participantArray);
                    error_log("array after remove : ".json_encode($participantArray));
                    $this->boardActivity->pushActivity(true, $workspaceId, $user, null, "Removed  from ".$task->getName(),"", Array(), Array("notifCode" => ""));
                    break;
                }
            }
        }

        $task->setParticipant($participantArray);
        $this->doctrine->persist($task);
        $this->doctrine->flush();
        $data = Array(
            "type" => "update",
            "task" => $task->getAsArray()
        );
        $this->pusher->push($data, "board/".$boardId);

        return true;

    }

    public function getTasks($boardId, $currentUserId = null)
    {
        $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read"))) {
            return null;
        }

        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("id" => $boardId));

        return $tasks;
    }

    public function getTask($taskId, $currentUserId){
        $workspace = $this->getWorkspaceFromTask($taskId);

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read"))) {
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

        if($workspaceLink->getWorkspace()->getId()==$workspaceId)
            return $task;

        return false;
    }
    //
    public function getTasksByBoard($workspaceId, $boardsId, $currentUserId = null){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        var_dump($workspaceId);
        var_dump($boardsId);
        if($workspace == null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read"))){
            return null;
        }
        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->getAllBoardTasksByBoard($boardsId);

        foreach ($tasks as $link) {
            $evt = $link->getAsArray();

            $result[] = $evt;
        }

        return $result;
    }

    public function getTasksForUser($workspaceId, $currentUserId)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read")) {
            return null;
        }

        $tasksLinks = $this->doctrine->getRepository("TwakeProjectBundle:LinkTaskUser")->findBy(Array("user" => $currentUserId));

        $tasks = Array();
        foreach ($tasksLinks as $taskLink){
            $tasks[] = $taskLink->getTask();
        }

        return $tasks;

    }

    public function getTaskById($workspaceId, $taskId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read")) {
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

    public function moveTaskToList($taskId, $listOfTasksId, $workspaceId = 0){
        $boardTaskRepository = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask");
        $listOfTasksRepository = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks");

        /* @var \WebsiteApi\ProjectBundle\Entity\BoardTask $task */
        $task = $boardTaskRepository->findOneBy(Array("id" => $taskId));
        /* @var \WebsiteApi\ProjectBundle\Entity\ListOfTasks $listofTasks */
        $listOfTasks = $listOfTasksRepository->findOneBy(Array("id" => $listOfTasksId));

        $task->setListOfTasks($listOfTasks);

        $this->doctrine->persist($task);
        $this->doctrine->flush();
        $this->notifyParticipants($task->getParticipants(),$workspaceId, "Task ".$task->getName()." moved", "", "");
    }

    public function moveTaskToBoard($taskId, $boardId, $workspaceId = 0){
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
            $this->notifyParticipants($task->getParticipants(),$workspaceId, "Task ".$task->getName()." moved", "", "");
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