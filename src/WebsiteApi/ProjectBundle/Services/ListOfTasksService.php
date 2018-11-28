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

    public function removeListOfTasks($listOfTaskId, $workspaceId = 0){
        /* @var ListOfTasks $listoftasks */
        $listoftasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTaskId));

        if (!$listoftasks)
            return false;

        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("listoftasks" => $listoftasks));

        foreach ($tasks as $task){
            $this->doctrine->remove($task);
        }

        $this->doctrine->remove($listoftasks);
        $this->doctrine->flush();

        return true;
    }

    public function getListOfTasks($boardId){
        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->findOneBy(Array("id" => $boardId));

        $ListsOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));

        return $ListsOfTasks;
    }

    public function createListOfTasks($newTitle, $newColor, $boardId, $useridtonotify)
    {
        $board = $this->convertToEntity($boardId, "TwakeProjectBundle:Board");
        $workspace = $this->getWorkspaceFromBoard($board->getId());

        /* @var ListOfTasks $listoftasks */
        $listoftasks = new ListOfTasks($board, $newTitle, $newColor, $useridtonotify);

        if($listOfTasks==null){
            return false;
        }

        if($newTitle!=null)
            $listoftasks->setTitle($newTitle);
        if($newColor!=null)
            $listoftasks->setColor($newColor);

        $listoftasks->setUserIdToNotify($useridtonotify);

        $listoftasks->setOrder($this->getMaxOrder($board) + 1);

        $this->doctrine->persist($listoftasks);
        $this->doctrine->flush();

        return $listoftasks;
    }

    public function updateListOfTasks($listOfTasksId, $newTitle, $newColor, $useridtonotify)
    {
        /* @var ListOfTasks $listoftasks */
        $listoftasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $listOfTasksId));
        $workspace = $this->getWorkspaceFromBoard($listoftasks->getBoard());

        if($listOfTasks==null){
            return false;
        }

        if($newTitle!=null)
            $listoftasks->setTitle($newTitle);
        if($newColor!=null)
            $listoftasks->setColor($newColor);

        $listoftasks->setUserIdToNotify($useridtonotify);

        $this->doctrine->persist($listoftasks);
        $this->doctrine->flush();

        return true;
    }

    public function moveListOfTasks($idsOrderMap, $boardId){
        $order_used = [];

        foreach ($idsOrderMap as $id => $order){
            $board = $this->convertToEntity($boardId,"TwakeProjectBundle:Board");
            /* @var ListOfTasks $listoftasks */
            $listoftasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findOneBy(Array("id" => $id, "board" => $board));
            if ($listoftasks == null || in_array($order, $order_used))
                continue;
            $listoftasks->setOrder($order);
            array_push($order_used,$order);
            $this->doctrine->persist($listoftasks);
        }

        $this->doctrine->flush();

        return true;
    }

    public function getListPercent($listoftasks)
    {
        $listoftasks = $this->convertToEntity($listoftasks, "TwakeProjectBundle:Board");
        $tasks = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")->findBy(Array("listoftasks" => $listoftasks));

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
            if ($list->getOrder() > $m)
                $m = $list->getOrder();
        }
        return $m;
    }
}