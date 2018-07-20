<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 19/07/18
 * Time: 16:00
 */

namespace WebsiteApi\ProjectBundle\Services;


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

    public function createListOfTasks($newTitle, $newColor, $workspaceId,$userIdToNotify){

        /* @var ListOfTasks $listOfTasks */
        $listOfTasks = new ListOfTasks();

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
}