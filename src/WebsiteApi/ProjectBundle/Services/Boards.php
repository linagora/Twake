<?php


namespace WebsiteApi\ProjectBundle\Services;

use phpDocumentor\Reflection\Types\Array_;
use PHPUnit\Util\Json;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\ProjectBundle\Entity\BoardTask;
use WebsiteApi\ProjectBundle\Entity\LinkBoardWorkspace;
use WebsiteApi\ProjectBundle\Entity\ListOfTasks;
use WebsiteApi\ProjectBundle\Model\BoardsInterface;
use WebsiteApi\ProjectBundle\Entity\Board;

/**
 * Manage board
 */
class Boards implements BoardsInterface
{

    var $doctrine;
    var $pusher;
    var $workspaceLevels;
    /* @var BoardActivities $boardActivities */
    var $boardActivities;
    /* @var ListOfTasksService $listOfTaskService */
    var $listOfTaskService;

    public function __construct($doctrine, $pusher, $workspaceLevels, $boardActivities, $listOfTaskService){
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
        $this->boardActivities = $boardActivities;
        $this->listOfTaskService = $listOfTaskService;
    }

    private function notifyParticipants($participants, $workspace, $title, $description, $notifCode){
        foreach ($participants as $participant){
            $user = $this->convertToEntity($participant,"TwakeUsersBundle:User");
            $this->boardActivities->pushActivity(true,$workspace,$user,null,$title,$description,Array(),Array("notifCode" => $notifCode));
        }
    }

    public function getBoard($board){
        if(is_int($board))
            $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->findOneBy(Array("id" => $board));

        $listoftasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        $result = [];

        foreach ($listoftasks as $listOfTask) {
            $array = $listOfTask->getAsArray();

            $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("listoftasks" => $listOfTask));
            $array["tasks"] = count($tasks);
            $array["tasks_pondered"] = 0;
            foreach ($tasks as $task)
                $array["tasks_pondered"] += $task->getWeight();
            $array["order"] = $listOfTask->getOrder();
            $array["percentage"] = $this->listOfTaskService->getListPercent($listOfTask);

            $result[] = $array;
        }

        return $result;
    }


    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var) || get_class($var) == "Ramsey\Uuid\Uuid") {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function getBoardPercent($board){
        $board = $this->convertToEntity($board,"TwakeProjectBundle:Board");
        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("board" => $board));

        $total = 0.0;
        $done = 0.0;

        foreach ($tasks as $task){
            /* @var BoardTask $task */
            $total+=$task->getWeight();
        }

        if($total!=0)
            return $done/$total;
        return 0.0;

    }

    public function getBoards($workspaceId, $currentUserId=null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));
        $result = Array();

        if ($workspace == null) {
            return false;
        } else {

            if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read")) {
                return null;
            }

            $links = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("workspace" => $workspace));

            $boards = [];

            foreach ($links as $link) {
                $boards[] = $link->getBoard();
            }

            //Create board if no board was found in this workspace
            if (count($links) == 0 && $currentUserId != null) {
                $board = $this->createBoard($workspaceId, "Default", "",true);
                $result[] = $board;
            }
            else
                $result = $boards;

            $final = [];

            if($currentUserId!=null) {
                foreach ($result as $res) {
                    /* @var Board $res */
                    if ($res->getisPrivate()) {
                        $participants = $res->getParticipants();
                        if(in_array($currentUserId,$participants))
                            $final[] = $res;
                    } else
                        $final[] = $res;
                }
            }

            return $final;
        }
    }

    /**
     * codé par une stagiaire et ça marche
     * @param $workspaceId
     * @param $boardId
     * @return array|bool
     */
    public function getBoardById($workspaceId, $boardId){
        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);


        $result = Array();

        if ($workspace == null || $boardId == null ) {
            return false;
        } else {
            $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
            $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));

            if(!$boardLink){
                return null;
            }else{

                $cal = $board->getAsArray();

            }


            return $cal;
        }
    }

    public function createBoard($workspaceId, $title, $description, $isPrivate, $currentUserId = null, $userIdParticipants = Array())
    {

        if ($currentUserId && $isPrivate && !in_array($currentUserId, $userIdParticipants)) {
            $userIdParticipants[] = $currentUserId;
        }

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:manage")) {
            return null;
        }

        if ($workspace == null) {
            return false;
        } else {

            if (strlen($title) == 0) {
                $title = "New board";
            }

            $board = new Board($title,$description,$isPrivate);
            $board->setParticipants($userIdParticipants);
            $board->setWorkspacesNumber(1);
            $this->doctrine->persist($board);

            $initialList = new ListOfTasks($board, "To do", "#51b75b");
            $this->doctrine->persist($initialList);
            $this->doctrine->flush();

            $link = new LinkBoardWorkspace($workspace, $board, true);
            $this->doctrine->persist($link);

            $this->doctrine->flush();

            $data = Array(
                "type" => "update",
                "board" => $board->getAsArray()
            );


            return $board;
        }
    }

    public function getParticipantsAsUser($board){
        $board = $this->convertToEntity($board,"TwakeProjectBundle:Board");
        $participants = $board->getParticipants();
        $final = [];

        foreach ($participants as $participant) {
            $final[] = $this->convertToEntity($participant,"TwakeUsersBundle:User");
        }

        return $final;
    }

    public function updateBoard($boardId, $title, $description, $isPrivate, $currentUserId = null, $autoParticipate = Array(), $userIdParticipants = Array())
    {

        if ($currentUserId && $isPrivate && !in_array($currentUserId, $userIdParticipants)) {
            $userIdParticipants[] = $currentUserId;
        }

        $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:manage")) {
            return null;
        }

        /* @var Board $board */
        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));


        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $board->setTitle($title);
        $board->setisPrivate($isPrivate);
        $board->setDescription($description);
        $board->setParticipants($userIdParticipants);

        $board->setAutoParticipantList($autoParticipate);

        $this->doctrine->persist($board);
        $this->doctrine->flush();

        $links = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("board" => $board));
        foreach ($links as $link) {
            $data = Array(
                "type" => "update",
                "board" => $board->getAsArray()
            );
        }

        return $board;

    }

    private function getWorkspaceFromBoard($boardId){
        /* @var Board $board*/
        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        /* @var LinkBoardWorkspace $linkBoardWorkspace*/
        $linkBoardWorkspace = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board" => $board));
        return $linkBoardWorkspace->getWorkspace();
    }

    public function removeBoard($workspaceId, $boardId, $currentUserId = null)
    {
        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:manage")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));

        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->removeAllByBoard($board);

        $links = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("board" => $board));
        foreach ($links as $link) {
            $data = Array(
                "type" => "remove",
                "board_id" => $boardId
            );

            $this->doctrine->remove($link);
        }


        $this->doctrine->remove($board);
        $this->doctrine->flush();

        return 1;

    }

    public function shareBoard($workspaceId, $boardId, $other_workspaceId, $hasAllRights = true, $currentUserId = null)
    {
        $boardLinkAlready = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$boardId, "workspace"=>$other_workspaceId));

        if($boardLinkAlready != false ){
            return "stop";
        }

        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);


        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:manage")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);

        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));

        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $other_workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $other_workspaceId, "is_deleted" => false));

        $otherBoardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board" => $board, "workspace" => $other_workspace));
        if ($otherBoardLink) {
            return; //Already exists
        }

        $shareLink = new LinkBoardWorkspace($other_workspace, $board, false, $hasAllRights);

        $board->setWorkspacesNumber($board->getWorkspacesNumber()+1);
        $this->doctrine->persist($board);

        $this->doctrine->persist($shareLink);
        $this->doctrine->flush();

        $data = Array(
            "type" => "update",
            "board" => $board->getAsArray()
        );

        return 1;
    }

    public function unshareBoard($workspaceId, $boardId, $other_workspaceId, $currentUserId = null)
    {
        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:manage")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));

        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $other_workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $other_workspaceId, "is_deleted" => false));
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$other_workspace));

        $board->setWorkspacesNumber($board->getWorkspacesNumber()-1);
        $this->doctrine->persist($board);

        $this->doctrine->remove($boardLink);
        $this->doctrine->flush();

        if($workspaceId!=$other_workspaceId) {
            $data = Array(
                "type" => "update",
                "board" => $board->getAsArray()
            );
        }

        $data = Array(
            "type" => "delete",
            "board_id" => $boardId
        );

        return 1;
    }

    public function getBoardShare($workspaceId, $boardId, $currentUserId = null)
    {
        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "is_deleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "tasks:read")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("board"=>$board));

        if(!$boardLink || !is_array($boardLink)){
            return null;
        }
        $allLinks = [] ;
        foreach ($boardLink as $calLink){
            if($calLink->getWorkspace()->getId() != $workspaceId && $calLink->getBoardRight()){
                $allLinks[] = $calLink;
            }
        }


        return $allLinks;
    }

    public function addWorkspaceMember($workspace, $user)
    {
        //Nothing to do
    }

    public function delWorkspaceMember($workspace, $user)
    {
        //Nothing to do
    }

}