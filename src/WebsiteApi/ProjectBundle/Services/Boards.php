<?php


namespace WebsiteApi\ProjectBundle\Services;

use phpDocumentor\Reflection\Types\Array_;
use PHPUnit\Util\Json;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\ProjectBundle\Entity\LinkBoardWorkspace;
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

    public function __construct($doctrine, $pusher, $workspaceLevels){
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
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

            foreach ($links as $link) {
                $cal = $link->getBoard()->getAsArray();
                $cal["owner"] = $link->getOwner();
                $result[] = $cal;
            }

            //Create board if no board was found in this workspace
            if (count($links) == 0 && $currentUserId != null) {
                $board = $this->createBoard($workspaceId, "Default", "E2333A");
                $cal = $board->getAsArray();
                $cal["owner"] = $currentUserId;
                $result[] = $cal;
            }

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
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


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

    public function createBoard($workspaceId, $title, $color, $currentUserId=null){
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

            $cal = new Board($title, $color);
            $cal->setWorkspacesNumber(1);
            $this->doctrine->persist($cal);

            $link = new LinkBoardWorkspace($workspace, $cal, true);
            $this->doctrine->persist($link);

            $this->doctrine->flush();

            $data = Array(
                "type" => "update",
                "board" => $cal->getAsArray()
            );
            $this->pusher->push($data, "board/workspace/".$workspaceId);


            return $cal;
        }
    }

    public function updateBoard($workspaceId, $boardId, $title, $color, $currentUserId = null, $autoParticipate = Array())
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:manage")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));


        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $board->setTitle($title);
        $board->setColor($color);

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

        return $board;

    }

    public function removeBoard($workspaceId, $boardId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:manage")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$board, "workspace"=>$workspace));

        if(!$boardLink || !$boardLink->getBoardRight()){
            return null;
        }

        $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->removeAllByBoard($board);

        $links = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("board" => $board));
        foreach ($links as $link) {
            $data = Array(
                "type" => "remove",
                "board_id" => $boardId
            );
            $this->pusher->push($data, "board/workspace/" . $link->getWorkspace()->getId());
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

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


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

        return 1;
    }

    public function unshareBoard($workspaceId, $boardId, $other_workspaceId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

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

        return 1;
    }

    public function getBoardShare($workspaceId, $boardId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

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