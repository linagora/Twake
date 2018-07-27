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

    public function __construct($doctrine, $pusher, $workspaceLevels, $notifications, $serviceBoardActivity, $objectLinksSystem)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
        $this->notifications = $notifications;
        $this->boardActivities = $serviceBoardActivity;
        $this->objectLinksSystem = $objectLinksSystem;
    }

    private function notifyParticipants($participants, $workspace, $title, $description, $notifCode){
        foreach ($participants as $participant){
            $user = $this->convertToEntity($participant,"TwakeUsersBundle:User");
            $this->boardActivities->pushActivity(true,$workspace,$user,null,$title,$description,Array(),Array("notifCode" => $notifCode));
        }
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = intval($var);
        }

        if (is_int($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function createTask($listId, $taskArray, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId = null, $userIdsToNotify=Array(), $participants=Array(), $weight=1)
    {
        /* @var ListOfTasks $list */
        $list = $this->convertToEntity($listId,"TwakeProjectBundle:ListOfTasks");
        $workspace = $this->getWorkspaceFromBoard($list->getBoard());
        $user = $this->convertToEntity($currentUserId,"TwakeUsersBundle:User");

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
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
        $task->setOrder($this->getMinOrder($board)-1);

        $task->setListOfTasks($list);
        $task->setBoard($board);

        $this->doctrine->persist($task);
        $this->doctrine->flush();

        $data = Array(
            "type" => "create",
            "task" => $task->getAsArray()
        );


        $this->notifyParticipants($userIdsToNotify,$workspace,"","","");

        return $task;

    }
    public function likeTask($taskId, $userId){
        /* @var BoardTask $task */

        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);
        $task->likeOne($userId);
        $this->doctrine->persist($task);
        $this->flush($task);
    }

    public function updateTask($taskId, $taskArray, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId, $userToNotify,$participants, $weight)
    {
        /* @var BoardTask $task */
        $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->find($taskId);

        if(!$task){
            return null;
        }
        $workspace = $this->getWorkspaceFromTask($taskId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $task->getBoard();


        if($board!=null)
            $task->setBoard($board);
        if($participants!=null)
            $task->setParticipants($participants);
        if($userToNotify!=null)
            $task->setUserIdToNotify($userToNotify);
        if($startDate!=null)
            $task->setFrom($startDate);
        if($endDate!=null)
            $task->setTo($endDate);

        $this->doctrine->persist($task);

        $this->doctrine->flush();

        $data = Array(
            "type" => "update",
            "task" => $task->getAsArray()
        );

        $this->objectLinksSystem->updateObject($task);

        $this->notifyParticipants($board->getParticipants(),$workspace, "Task ".$task->getName()." updated", "", "");
        $this->notifyParticipants($task->getUserIdToNotify(),$workspace, "Task ".$task->getName()." updated", "", "");
        

        return $task;
    }

    public function removeTask($workspaceId, $boardId, $taskId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);

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
        
        $this->notifyParticipants($board->getParticipants(),$workspace, "Task ".$task->getName()." deleted", "", "");
        $this->notifyParticipants($task->getParticipants(),$workspace, "Task ".$task->getName()." deleted", "", "");

        return true;
    }

    public function moveTask($idsOrderMap,$listId, $boardId)
    {
        $board = $this->convertToEntity($boardId,"TwakeProjectBundle:Board");
        $list = $this->convertToEntity($listId,"TwakeProjectBundle:ListOfTasks");
        foreach ($idsOrderMap as $id => $order){
            /* @var BoardTask $task */
            $task = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findOneBy(Array("id" => $id, "board" => $board));
            if($task==null)
                continue;
            $task->setListOfTasks($list);
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
        
        return true;

    }

    public function removeUsers($workspaceId, $boardId, $taskId, $usersId, $currentUserId = null)
    {

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);

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
        

        return true;

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

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read"))) {
            return null;
        }

        $board = $this->convertToEntity($boardId,"TwakeProjectBundle:Board");

        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("board" => $board));

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

        if($workspaceLink->getWorkspace()->getId()==$workspace->getId())
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