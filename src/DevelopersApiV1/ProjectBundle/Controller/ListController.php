<?php

namespace DevelopersApiV1\ProjectBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use \Eluceo\iCal\Component;

class ListController extends Controller
{
    /**
     *
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @return JsonResponse
     */
    public function createListAction(Request $request, $workspace_id, $calendar_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $list = Array();
        $participants = Array();

        $list["from"] = isset($content["from"]) ? $content["from"] : 0;
        $list["to"] = isset($content["to"]) ? $content["to"] : 0;

        $result = $this->get("app.calendar_lists")->createList($workspace_id, $calendar_id, $list, null, false, $participants);

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
     * @param $list_id
     * @param $calendar_id
     * @return JsonResponse
     */
    public function deleteListAction(Request $request, $workspace_id, $list_id, $calendar_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $result = $this->get("app.calendar_lists")->removeList($workspace_id, $calendar_id, $list_id, null);

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
     * @param $list_id
     * @return JsonResponse
     */
    public function editListAction(Request $request, $workspace_id, $list_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $olderData = $this->get("app.calendar_lists")->getListById($workspace_id, $list_id, null);
        $olderList = $olderData["list"];

        $calendar = isset($content["calendar"]) ? $content["calendar"] : $olderData["calendar"];
        $olderList["from"] = isset($content["from"]) ? $content["from"] : $olderList["from"];
        $olderList["to"] = isset($content["to"]) ? $content["to"] : $olderList["to"];
        $olderList["title"] = isset($content["title"]) ? $content["title"] : $olderList["title"];
        $olderList["typeList"] = isset($content["typeList"]) ? $content["typeList"] : $olderList["typeList"];

        $result = ($this->get("app.calendar_lists")->updateList($workspace_id, $calendar, $list_id, $olderList, null))->getAsArray();

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
     * @param $list_id
     * @return JsonResponse
     */
    public function moveListAction(Request $request, $workspace_id, $list_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $olderData = $this->get("app.calendar_lists")->getListById($workspace_id, $list_id, null);
        $olderList = $olderData["list"];

        $calendar = isset($content["calendar"]) ? $content["calendar"] : $olderData["calendar"];
        $olderList["from"] = isset($content["from"]) ? $content["from"] : $olderList["from"];
        $olderList["to"] = isset($content["to"]) ? $content["to"] : $olderList["to"];
        $olderList["title"] = isset($content["title"]) ? $content["title"] : $olderList["title"];
        $olderList["typeList"] = isset($content["typeList"]) ? $content["typeList"] : $olderList["typeList"];

        $result = ($this->get("app.calendar_lists")->updateList($workspace_id, $calendar, $list_id, $olderList, null))->getAsArray();

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4009);
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);
    }

}
