<?php

namespace WebsiteApi\ProjectBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class ListOfTasksController extends Controller
{


    public function getAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $boardId = $request->request->get("boardId", 0);
        $lists = $this->get("app.list_of_tasks_service")->getListOfTasks($boardId);

        if(!$lists) {
            $data["errors"][] = "Board not found or there are no task on this board";
        }
        else{
            foreach ($lists as $list)
            {
                $listArray = $list->getAsArray();
                $listArray["percentage"] = $this->get("app.list_of_tasks_service")->getListPercent($list);
                $data["data"][] = $listArray;
            }
        }

        return new JsonResponse($data);
    }

    public function updateAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $listOfTasksId = $request->request->get("listOfTasksId", 0);
        $newTitle = $request->request->get("newTitle", null);
        $newColor = $request->request->get("newColor", null);

        if(!$this->get("app.list_of_tasks_service")->updateListOfTasks($listOfTasksId, $newTitle, $newColor)) {
            $data["errors"][] = "List of tasks not found";
        }
        else{
            $data["data"] = "success";
        }
        return new JsonResponse($data);
    }

    public function removeAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $listOfTaskId = $request->request->get("listOfTaskId", 0);

        if(!$this->get("app.list_of_tasks_service")->removeListOfTasks($listOfTaskId)) {
            $data["errors"][] = "List of tasks not found";
        }
        else{
            $data["data"] = "success";
        }

        return new JsonResponse($data);
    }

    public function moveAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $listOfTaskAId = $request->request->get("idA", 0);
        $listOfTaskBId = $request->request->get("idB", 0);

        if(!$this->get("app.list_of_tasks_service")->moveListOfTasks($listOfTaskAId, $listOfTaskBId)) {
            $data["errors"][] = "List of tasks not found";
        }
        else{
            $data["data"] = "success";
        }

        return new JsonResponse($data);
    }
}