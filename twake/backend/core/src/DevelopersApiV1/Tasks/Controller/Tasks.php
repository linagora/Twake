<?php


namespace DevelopersApiV1\Tasks\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Tasks extends BaseController
{
    public function removeTask(Request $request)
    {
        $capabilities = ["tasks_task_remove"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $object = $request->request->get("object", null);
        $user = null;
        $object = $this->get("app.tasks.task")->remove($object, Array(), $user);

        $event = Array(
            "client_id" => "system",
            "action" => "remove",
            "object_type" => "",
            "front_id" => $object["front_id"]
        );
        $this->get("app.websockets")->push("board_tasks/" . $object["board_id"], $event);

        $this->get("administration.counter")->incrementCounter("total_api_tasks_operation", 1);

        return new Response(Array("result" => $object));
    }

    public function saveTask(Request $request)
    {

        $capabilities = ["tasks_task_save"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $object = $request->request->get("object", null);
        $user = null;
        try {
            $object = $this->get("app.tasks.task")->save($object, Array(), $user);
        } catch (\Exception $e) {
            $object = false;
        }
        if (!$object) {
            return new Response(Array("error" => "unknown error or malformed query."));
        }

        if ($object) {

            $event = Array(
                "client_id" => "system",
                "action" => "save",
                "object_type" => "",
                "object" => $object
            );
            $this->get("app.websockets")->push("board_tasks/" . $object["board_id"], $event);

        }

        $this->get("administration.counter")->incrementCounter("total_api_tasks_operation", 1);

        return new Response(Array("object" => $object));

    }

    public function getBoardList(Request $request)
    {
        $privileges = ["workspace_tasks"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }
        $objects = false;
        $user_id = $request->request->get("user_id", "");
        $workspace_id = $request->request->get("workspace_id", "");
        if ($workspace_id) {
            $user_entity = null;
            if ($user_id) {
                $user_entity = $this->get("app.users")->getById($user_id, true);
            }
            if ($user_entity) {
                $objects = $this->get("app.tasks.board")->get(Array("workspace_id" => $workspace_id), $user_entity);
            }
        }

        if ($objects === false) {
            return new Response(Array("error" => "payload_error"));
        }

        $res = [];
        foreach ($objects as $object) {
            $res[] = $object;
        }

        $this->get("administration.counter")->incrementCounter("total_api_tasks_operation", 1);

        return new Response(Array("data" => $res));
    }

    public function getListsInBoard(Request $request)
    {
        $privileges = ["workspace_tasks"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }
        $objects = false;
        $user_id = $request->request->get("user_id", "");
        $board_id = $request->request->get("board_id", "");
        $workspace_id = $request->request->get("workspace_id", "");
        if ($workspace_id) {
            $user_entity = null;
            if ($user_id) {
                $user_entity = $this->get("app.users")->getById($user_id, true);
            }
            if ($user_entity) {
                $objects = $this->get("app.tasks.list")->get(Array("board_id" => $board_id, "workspace_id" => $workspace_id), $user_entity);
            }
        }

        if ($objects === false) {
            return new Response(Array("error" => "payload_error"));
        }

        $res = [];
        foreach ($objects as $object) {
            $res[] = $object;
        }

        $this->get("administration.counter")->incrementCounter("total_api_tasks_operation", 1);

        return new Response(Array("data" => $res));
    }

    public function getTasksInBoard(Request $request)
    {
        $privileges = ["workspace_tasks"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }
        $objects = false;
        $user_id = $request->request->get("user_id", "");
        $board_id = $request->request->get("board_id", "");
        $workspace_id = $request->request->get("workspace_id", "");
        if ($workspace_id) {
            $user_entity = null;
            if ($user_id) {
                $user_entity = $this->get("app.users")->getById($user_id, true);
            }
            if ($user_entity) {
                $objects = $this->get("app.tasks.task")->get(Array("board_id" => $board_id, "workspace_id" => $workspace_id), $user_entity);
            }
        }

        if ($objects === false) {
            return new Response(Array("error" => "payload_error"));
        }

        $res = [];
        foreach ($objects as $object) {
            $res[] = $object;
        }

        $this->get("administration.counter")->incrementCounter("total_api_tasks_operation", 1);

        return new Response(Array("data" => $res));
    }

}