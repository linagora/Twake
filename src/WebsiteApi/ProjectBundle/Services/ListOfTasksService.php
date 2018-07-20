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

    public function removeListOfTasks($listOfTaskId){
        $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTaskId));

        if(!$listOfTasks)
            return false;

        $this->doctrine->remove($listOfTasks);
        $this->doctrine->flush();

        return true;
    }

    public function getListOfTasks($boardId){
        $board = $this->doctrine->getReposistory("TwakeProjectBundle:Board")->findOneBy(Array("id" => $boardId));

        $ListsOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        return $ListsOfTasks;
    }

    public function updateListOfTasks($listOfTasksId, $newTitle, $newColor){

        /* @var ListOfTasks $listOfTasks */
        $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTasksId));

        if($listOfTasks==null){
            return false;
        }

        if($newTitle!=null)
            $listOfTasks->setTitle($newTitle);
        if($newColor!=null)
            $listOfTasks->setColor($newColor);

        $this->doctrine->persist($listOfTasks);
        $this->doctrine->flush();


        return true;
    }
}