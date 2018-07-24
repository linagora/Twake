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
        $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTaskId));

        if(!$listOfTasks)
            return false;

        $this->doctrine->remove($listOfTasks);
        $this->doctrine->flush();
        $this->notifyParticipants($listOfTasks->getParticipants(),$workspaceId, "List ".$listOfTasks->getTitle()." removed", "", "");

        return true;
    }

    public function getListOfTasks($boardId){
        $board = $this->doctrine->getReposistory("TwakeProjectBundle:Board")->findOneBy(Array("id" => $boardId));

        $ListsOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        return $ListsOfTasks;
    }

    public function createListOfTasks($newTitle, $newColor, $boardId,$userIdToNotify){
        $board = $this->convertToEntity($boardId, "TwakeProjectBundle:Board");
        $workspace = $this->getWorkspaceFromBoard($board);

        /* @var ListOfTasks $listOfTasks */
        $listOfTasks = new ListOfTasks($board,$newTitle,$newColor,false,$userIdToNotify);

        if($listOfTasks==null){
            return false;
        }

        if($newTitle!=null)
            $listOfTasks->setTitle($newTitle);
        if($newColor!=null)
            $listOfTasks->setColor($newColor);

        $listOfTasks->setParticipants($userIdToNotify);

        $this->doctrine->persist($listOfTasks);
        $this->doctrine->flush();

        $this->notifyParticipants($listOfTasks->getParticipants(),$workspace->getId(), "List ".$listOfTasks->getTitle()." created", "", "");

        return true;
    }

    public function updateListOfTasks($listOfTasksId, $newTitle, $newColor, $workspaceId,$userIdToNotify){

        /* @var ListOfTasks $listOfTasks */
        $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTasksId));

        if($listOfTasks==null){
            return false;
        }

        if($newTitle!=null)
            $listOfTasks->setTitle($newTitle);
        if($newColor!=null)
            $listOfTasks->setColor($newColor);

        $listOfTasks->setParticipants($userIdToNotify);

        $this->doctrine->persist($listOfTasks);
        $this->doctrine->flush();

        $this->notifyParticipants($listOfTasks->getParticipants(),$workspaceId, "List ".$listOfTasks->getTitle()." updated", "", "");

        return true;
    }

    public function moveListOfTasks($listOfTasksIdA, $listOfTasksIdB){
        /* @var ListOfTasks $listOfTasksA */
        $listOfTasksA = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTasksIdA));

        /* @var ListOfTasks $listOfTasksB */
        $listOfTasksB = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTasksIdB));

        $order = $listOfTasksA->getOrder();
        $listOfTasksA->setOrder($listOfTasksB->getOrder());
        $listOfTasksB->setOrder($order);
        $this->doctrine->persist($listOfTasksA);
        $this->doctrine->persist($listOfTasksB);
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

}