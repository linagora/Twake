<?php

namespace WebsiteApi\ProjectBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class TaskController extends Controller
{

    public function likeAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $taskId = $request->request->get("id", 0);

        $success = $this->get("app.board_tasks")->likeTask($taskId, $this->getUser()->getId());

        if($success)
            $data["data"][] = "success";
        else
            $data["error"][] = "fail";


        return new JsonResponse($data);
    }

    public function getAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $boardId = $request->request->get("boardId", 0);

        $tasks = $this->get("app.board_tasks")->getTasks($boardId, $this->getUser()->getId());

        if($tasks){
            $tasks_formated = Array();
            foreach ($tasks as $task){
                $tasks_temp = $task->getAsArray();
                $participants = $this->get("app.board_tasks")->getParticipantsAsUser($task);
                $tasks_temp["participants"] = [];
                foreach ($participants as $participant)
                    $tasks_temp["participants"][] = $participant->getAsArray();
                $usersToNotify = $this->get("app.board_tasks")->getUserToNotifyAsUser($task);
                $tasks_temp["watch_members"] = [];
                foreach ($usersToNotify as $userToNotify)
                    $tasks_temp["watch_members"][] = $userToNotify->getAsArray();
                $tasks_formated[] = $tasks_temp;
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

        $task = $request->request->get("task", Array());
        $listId = $request->request->get("listId", 0);
        $weight = $request->request->get("weight", 1);
        $name = $request->request->get("name", "");
        $description = $request->request->get("description","");
        $startDate = $request->request->get("startDate",0);
        $endDate = $request->request->get("endDate",0);
        $dependingTaskId = $request->request->get("dependingTaskId",0);
        $userToNotify = $request->request->get("watch_members",Array());
        $participants = $request->request->get("participants",Array());

        //$listId, $taskArray, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId = null, $addMySelf = false, $userIdsToNotify=Array(),$participants, $weight=1
        $task = $this->get("app.board_tasks")->createTask($listId, $task, $name, $description, $startDate, $endDate, $dependingTaskId, $this->getUser()->getId(), $userToNotify,$participants, $weight);

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

        $idsOrderMap = $request->request->get("orders");
        $listId = $request->request->get("listId");
        $boardId = $request->request->get("boardId");
        $data['data'] = $this->get("app.board_tasks")->moveTask($idsOrderMap,$listId, $boardId);

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