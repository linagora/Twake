<?php

namespace DevelopersApiV1\ProjectBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use \Eluceo\iCal\Component;

class TaskController extends Controller
{
    /**
     *
     * @param Request $request
     * @param $workspace_id
     * @param $project_id
     * @return JsonResponse
     */
    public function createTaskAction(Request $request, $workspace_id, $project_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "project:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $task = Array();
        $participants = Array();

        $task["from"] = isset($content["from"]) ? $content["from"] : 0;
        $task["to"] = isset($content["to"]) ? $content["to"] : 0;

        $result = $this->get("app.project_tasks")->createTask($workspace_id, $project_id, $task, null, false, $participants);

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4007);
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result->getAsArray();
        }

        return new JsonResponse($data);

    }

    /**
     *
     * @param Request $request
     * @param $workspace_id
     * @param $task_id
     * @param $project_id
     * @return JsonResponse
     */
    public function deleteTaskAction(Request $request, $workspace_id, $task_id, $project_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "project:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $result = $this->get("app.project_tasks")->removeTask($workspace_id, $project_id, $task_id, null);

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4008);
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
        }

        return new JsonResponse($data);
    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @param $task_id
     * @return JsonResponse
     */
    public function editTaskAction(Request $request, $workspace_id, $task_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "project:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $olderData = $this->get("app.project_tasks")->getTaskById($workspace_id, $task_id, null);
        $olderTask = $olderData["task"];

        $project = isset($content["project"]) ? $content["project"] : $olderData["project"];
        $olderTask["from"] = isset($content["from"]) ? $content["from"] : $olderTask["from"];
        $olderTask["to"] = isset($content["to"]) ? $content["to"] : $olderTask["to"];
        $olderTask["title"] = isset($content["title"]) ? $content["title"] : $olderTask["title"];
        $olderTask["typeTask"] = isset($content["typeTask"]) ? $content["typeTask"] : $olderTask["typeTask"];

        $result = ($this->get("app.project_tasks")->updateTask($workspace_id, $project, $task_id, $olderTask, null))->getAsArray();

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4009);
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);
    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @param $task_id
     * @return JsonResponse
     */
    public function getTaskAction(Request $request, $workspace_id, $task_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "project:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $result = $this->get("app.project_tasks")->getTaskById($workspace_id, $task_id, null);

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4010);
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);
    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @param $project_id
     * @return JsonResponse
     */
    public function getAllTaskAction(Request $request, $workspace_id, $project_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "project:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $result = $this->get("app.project_tasks")->getTasksByCalendar($workspace_id, $project_id, null);

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4013);
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);
    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @param $project_id
     * @return JsonResponse
     */
    public function moveTaskAction(Request $request, $workspace_id, $project_id, $task_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "project:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $result = $this->get("app.project_tasks")->getTasksByCalendar($workspace_id, $project_id, null);

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4013);
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);
    }


}
