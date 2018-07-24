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

    public function __construct($doctrine, $pusher, $workspaceLevels, $boardActivities){
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
        $this->boardActivities = $boardActivities;
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

        $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        $result = [];

        foreach ($listOfTasks as $listOfTask){
            $array = $listOfTask->getAsArray();

            $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("listOfTask" => $listOfTask));
            $array["tasks"] = count($tasks);
            $array["order"] = $listOfTask->getOrder();

            $result[] = $array;
        }

        return $result;
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

    public function getBoardPercent($board){
        $board = $this->convertToEntity($board,"TwakeProjectBundle:Board");
        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("board" => $board));

        $total = 0.0;
        $done = 0.0;

        foreach ($tasks as $task){
            /* @var BoardTask $task */

            $total++;
            if($task->getListOfTasks()->getIsDoneList())
                $done++;
        }

        if($total!=0)
            return $done/$total;
        return 0.0;

    }

    public function getBoards($workspaceId, $currentUserId=null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        $result = Array();

        if ($workspace == null) {
            return false;
        } else {

            if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read")) {
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

            return $result;
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
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
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

    public function createBoard($workspaceId, $title, $description, $isPrivate, $currentUserId = null, $userIdToNotify = Array()){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:manage")) {
            return null;
        }

        if ($workspace == null) {
            return false;
        } else {

            if (strlen($title) == 0) {
                $title = "New board";
            }

            $board = new Board($title,$description,$isPrivate);
            $board->setParticipants($userIdToNotify);
            $board->setWorkspacesNumber(1);
            $this->doctrine->persist($board);

            $doneListOfTasks = new ListOfTasks($board,"Done","",true);
            $this->doctrine->persist($doneListOfTasks);

            $link = new LinkBoardWorkspace($workspace, $board, true);
            $this->doctrine->persist($link);

            $this->doctrine->flush();

            $data = Array(
                "type" => "update",
                "board" => $board->getAsArray()
            );
            $this->pusher->push($data, "board/workspace/".$workspaceId);


            return $board;
        }
    }

    public function updateBoard($workspaceId, $boardId, $title, $description, $color, $isPrivate, $currentUserId = null, $autoParticipate = Array(), $userIdToNotify = Array())
    {
        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:manage")) {
            return null;
        }

        /* @var Board $board */
        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));


        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $board->setTitle($title);
        $board->setColor($color);
        $board->setisPrivate($isPrivate);
        $board->setDescription($description);
        $board->setParticipants($userIdToNotify);

        $board->setAutoParticipantList($autoParticipate);

        $this->doctrine->persist($board);
        $this->doctrine->flush();

        $links = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("board" => $board));
        foreach ($links as $link) {
            $data = Array(
                "type" => "update",
                "board" => $board->getAsArray()
            );
            $this->pusher->push($data, "board/workspace/" . $link->getWorkspace()->getId());
        }

        $participants = $board->getParticipants();

        $this->notifyParticipants($participants,$workspace, "", "", "");

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
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:manage")) {
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
            $this->pusher->push($data, "board/workspace/" . $link->getWorkspace()->getId());
            $this->doctrine->remove($link);
        }


        $participants = $board->getParticipants();

        $this->notifyParticipants($participants,$workspace, "", "", "");

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
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);


        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:manage")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);

        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));

        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $other_workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $other_workspaceId, "isDeleted" => false));

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
        $this->pusher->push($data, "board/workspace/".$workspaceId);
        $this->pusher->push($data, "board/workspace/".$other_workspaceId);

        $this->notifyParticipants($board->getParticipants(),$workspace, "", "", "");

        return 1;
    }

    public function unshareBoard($workspaceId, $boardId, $other_workspaceId, $currentUserId = null)
    {
        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:manage")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));

        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $other_workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $other_workspaceId, "isDeleted" => false));
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
            $this->pusher->push($data, "board/workspace/".$workspaceId);
        }

        $data = Array(
            "type" => "delete",
            "board_id" => $boardId
        );
        $this->pusher->push($data, "board/workspace/".$other_workspaceId);
        $this->notifyParticipants($board->getParticipants(),$workspace, "", "", "");

        return 1;
    }

    public function getBoardShare($workspaceId, $boardId, $currentUserId = null)
    {
        if($workspaceId!=0)
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        else
            $workspace = $this->getWorkspaceFromBoard($boardId);

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read")) {
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