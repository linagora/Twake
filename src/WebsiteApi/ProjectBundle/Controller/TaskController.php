<?php

namespace WebsiteApi\ProjectBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class TaskController extends Controller
{


    public function getAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $boardId = $request->request->get("id",0);

        $tasks = $this->get("app.board_tasks")->getTasks($boardId, $this->getUser()->getId());

        if($tasks){
            $tasks_formated = Array();
            foreach ($tasks as $task){
                $tasks_formated[] = $task->getAsArray();
            }
            $data["data"] = $tasks_formated;
        }

        return new JsonResponse($data);
    }
    public function getOneTaskAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );
        $taskId = $request->request->get("taskId");
        $workspaceId = $request->request->getInt("workspaceId");

        $task = $this->get("app.board_tasks")->getTask($taskId, $this->getUser()->getId());

        if($task){
            $data["data"] = $task->getAsArray();
        }

        return new JsonResponse($data);
    }


    public function createAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $task = $request->request->get("task");
        $boardId = $request->request->get("boardId");
        $weight = $request->request->get("weight");
        $name = $request->request->get("name");
        $description = $request->request->get("description");
        $startDate = $request->request->get("startDate");
        $endDate = $request->request->get("endDate");
        $dependingTaskId = $request->request->get("dependingTaskId");
        $participants = $request->request->get("members");

        $task = $this->get("app.board_tasks")->createTask($boardId, $task, $name, $description, $startDate, $endDate, $dependingTaskId, $this->getUser()->getId(), $participants, $weight);

        if($task == null){
            $data["errors"] = "error";
        }
        else{
            $data['data'] = $task->getAsArray();
        }

        return new JsonResponse($data);
    }

    public function updateAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $taskId = $request->request->get("taskId");
        $task = $request->request->get("task");
        $boardId = $request->request->get("boardId");

        $data['data'] = $this->get("app.board_tasks")->updateTask($workspaceId, $boardId, $taskId, $task, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function removeAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $taskId = $request->request->get("taskId");
        $boardId = $request->request->get("boardId");

        $data['data'] = $this->get("app.board_tasks")->removeTask($workspaceId, $boardId, $taskId, $this->getUser()->getId());

        return new JsonResponse($data);
    }
    public function moveAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $taskIdA = $request->request->get("idA");
        $taskIdB = $request->request->get("idB");
        $data['data'] = $this->get("app.board_tasks")->moveTask($taskIdA, $taskIdB, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function addUsersAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $taskId = $request->request->get("taskId");
        $boardId = $request->request->get("boardId");
        $usersId = $request->request->get("usersId");

        $data['data'] = $this->get("app.board_tasks")->addUsers($workspaceId, $boardId, $taskId, $usersId, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function removeUsersAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $taskId = $request->request->get("taskId");
        $boardId = $request->request->get("boardId");
        $usersId = $request->request->get("usersId");

        $data['data'] = $this->get("app.board_tasks")->removeUsers($workspaceId, $boardId, $taskId, $usersId, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function getUsersAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $taskId = $request->request->get("taskId");

        $data['data'] = $this->get("app.board_tasks")->getUsers( $taskId, $this->getUser()->getId());

        return new JsonResponse($data);
    }
}