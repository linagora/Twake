<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 19/07/18
 * Time: 16:00
 */

namespace WebsiteApi\ProjectBundle\Services;


use WebsiteApi\ProjectBundle\Entity\BoardTask;
use WebsiteApi\ProjectBundle\Entity\ListOfTasks;

class ListOfTasksService
{
    var $doctrine;
    var $pusher;
    var $workspaceLevels;

    public function __construct($doctrine, $pusher, $workspaceLevels){
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
    }

    private function notifyParticipants($participants, $workspace, $title, $description, $notifCode){
        foreach ($participants as $participant){
            $user = $this->convertToEntity($participant,"TwakeUsersBundle:User");
            $this->boardActivities->pushActivity(true,$workspace,$user,null,$title,$description,Array(),Array("notifCode" => $notifCode));
        }
    }

    private function getWorkspaceFromBoard($boardId){
        /* @var Board $board*/
        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        /* @var LinkBoardWorkspace $linkBoardWorkspace*/
        $linkBoardWorkspace = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board" => $board));
        return $linkBoardWorkspace->getWorkspace();
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

    public function removeListOfTasks($listOfTaskId, $workspaceId = 0){
        /* @var ListOfTasks $listOfTasks */
        $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTaskId));

        if(!$listOfTasks)
            return false;

        $this->doctrine->remove($listOfTasks);
        $this->doctrine->flush();
        $this->notifyParticipants($listOfTasks->getUserIdToNotify(),$workspaceId, "List ".$listOfTasks->getTitle()." removed", "", "");

        return true;
    }

    public function getListOfTasks($boardId){
        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->findOneBy(Array("id" => $boardId));

        $ListsOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        return $ListsOfTasks;
    }

    public function createListOfTasks($newTitle, $newColor, $boardId,$userIdToNotify){
        $board = $this->convertToEntity($boardId, "TwakeProjectBundle:Board");
        $workspace = $this->getWorkspaceFromBoard($board->getId());

        /* @var ListOfTasks $listOfTasks */
        $listOfTasks = new ListOfTasks($board,$newTitle,$newColor,false,$userIdToNotify);

        if($listOfTasks==null){
            return false;
        }

        if($newTitle!=null)
            $listOfTasks->setTitle($newTitle);
        if($newColor!=null)
            $listOfTasks->setColor($newColor);

        $listOfTasks->setUserIdToNotify($userIdToNotify);

        $listOfTasks->setOrder($this->getMaxOrder($board)+1);

        $this->doctrine->persist($listOfTasks);
        $this->doctrine->flush();

        $this->notifyParticipants($listOfTasks->getUserIdToNotify(),$workspace->getId(), "List ".$listOfTasks->getTitle()." created", "", "");

        return $listOfTasks;
    }

    public function updateListOfTasks($listOfTasksId, $newTitle, $newColor,$userIdToNotify){
        /* @var ListOfTasks $listOfTasks */
        $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTasksId));
        $workspace = $this->getWorkspaceFromBoard($listOfTasks->getBoard());

        if($listOfTasks==null){
            return false;
        }

        if($newTitle!=null)
            $listOfTasks->setTitle($newTitle);
        if($newColor!=null)
            $listOfTasks->setColor($newColor);

        $listOfTasks->setUserIdToNotify($userIdToNotify);

        $this->doctrine->persist($listOfTasks);
        $this->doctrine->flush();

        $this->notifyParticipants($listOfTasks->getUserIdToNotify(),$workspace->getId(), "List ".$listOfTasks->getTitle()." updated", "", "");

        return true;
    }

    public function moveListOfTasks($idsOrderMap){

        foreach ($idsOrderMap as $id => $order){
            /* @var ListOfTasks $listOfTasks */
            $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $id));
            if($listOfTasks==null)
                continue;
            $listOfTasks->setOrder($order);
            $this->doctrine->persist($listOfTasks);
        }

        $this->doctrine->flush();

        return true;
    }

    public function getListPercent($listOfTasks){
        $listOfTasks = $this->convertToEntity($listOfTasks,"TwakeProjectBundle:Board");
        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("listOfTasks" => $listOfTasks));

        $total = 0.0;
        $done = 0.0;

        foreach ($tasks as $task){
            /* @var BoardTask $task */

            $total+=$task->getWeight();
            if($task->getListOfTasks()->getIsDoneList())
                $done+=$task->getWeight();
        }

        if($total!=0)
            return $done/$total;
        return 0.0;

    }

    private function getMinOrder($board)
    {
        $board = $this->convertToEntity($board,"TwakeProjectBundle:Board");

        $ListsOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        $m = 0;
        foreach ($ListsOfTasks as $list){
            if($list->getOrder()<$m)
                $m = $list->getOrder();
        }
        return $m;
    }


    private function getMaxOrder($board)
    {
        $board = $this->convertToEntity($board,"TwakeProjectBundle:Board");

        $ListsOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        $m = -100000;
        foreach ($ListsOfTasks as $list){
            if($list->getOrder()>$m && !$list->getisDoneList())
                $m = $list->getOrder();
        }
        return $m;
    }
}