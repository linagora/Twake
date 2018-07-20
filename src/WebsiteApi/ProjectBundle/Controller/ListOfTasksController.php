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

        if(!$this->get("app.list_of_tasks_service")->getListOfTasks($boardId)) {
            $data["errors"][] = "Board not found or there are no task on this board";
        }
        else{
            $data["data"] = "success";
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
}