<?php

namespace DevelopersApiV1\CalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
class CalendarController extends Controller
{
    public function indexAction()
    {
        return $this->render('CalendarBundle:Default:index.html.twig');
    }

    public function createCalendarAction(Request $request, $workspace_id){

        $application = $this->get("api.v1.check")->check($request);

        if(!$application){
            return new JSonResponse("application");
        }

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:write", $workspace_id)){
            return new JSonResponse("allowed");
        }

        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse("content");
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $title = isset($content["title"])? $content["title"] : 0 ;
        $color = isset($content["color"])? $content["color"] : 0 ;

        $data["data"] =($this->get("app.calendars")->createCalendar($workspace_id, $title, $color, null))->getAsArray();

        return new JsonResponse($data);
    }

    public function deleteCalendarAction(Request $request, $workspace_id, $calendar_id){

        $application = $this->get("api.v1.check")->check($request);

        if(!$application){
            return new JSonResponse("application");
        }

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage", $workspace_id)){
            return new JSonResponse("allowed");
        }

        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse("content");
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $data["data"] =($this->get("app.calendars")->removeCalendar($workspace_id, $calendar_id, null));

        return new JsonResponse($data);
    }

    public function editCalendarAction(Request $request, $workspace_id, $calendar_id){
        $application = $this->get("api.v1.check")->check($request);

        if(!$application){
            return new JSonResponse("application");
        }

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage", $workspace_id)){
            return new JSonResponse("allowed");
        }

        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse("content");
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $olderData =$this->get("app.calendars")->getCalendarById($workspace_id, $calendar_id);


        $title = isset($content["title"])? $content["title"] : $olderData["name"];
        $color = isset($content["color"])? $content["color"] : $olderData["color"] ;

        $data["data"] =($this->get("app.calendars")->updateCalendar($workspace_id, $calendar_id, $title, $color, null))->getAsArray();


        return new JsonResponse($data);
    }

    public function getCalendarAction(Request $request, $workspace_id, $calendar_id){
        $application = $this->get("api.v1.check")->check($request);

        if(!$application){
            return new JSonResponse("application");
        }

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:read", $workspace_id)){
            return new JSonResponse("allowed");
        }

        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse("content");
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $data["data"] =($this->get("app.calendars")->getCalendarById($workspace_id, $calendar_id));

        return new JsonResponse($data);

    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @param $other_workspace_id
     * @return JsonResponse
     */
    public function shareAction(Request $request, $workspace_id, $calendar_id, $other_workspace_id){
        $application = $this->get("api.v1.check")->check($request);

        if(!$application){
            return new JSonResponse("application");
        }

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage", $workspace_id)){
            return new JSonResponse("allowed");
        }

        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse("content");
        }

        if(!$workspace_id || !$calendar_id || !$other_workspace_id){
            return null;
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

       ($this->get("app.calendars")->shareCalendar($workspace_id, $calendar_id, $other_workspace_id, true,null));

        $data["data"] = ($this->get("app.calendars")->getCalendarById($other_workspace_id, $calendar_id));

        return new JsonResponse($data);

    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @param $other_workspace_id
     * @return JsonResponse
     */
    public function unshareAction(Request $request, $workspace_id, $calendar_id, $other_workspace_id){
        $application = $this->get("api.v1.check")->check($request);

        if(!$application){
            return new JSonResponse("application");
        }

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage",$workspace_id)){
            return new JSonResponse("allowed");
        }

        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse("content");
        }
        if(!$workspace_id || !$calendar_id || !$other_workspace_id){
            return null;
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        ($this->get("app.calendars")->unshareCalendar($workspace_id, $calendar_id, $other_workspace_id, true,null));
        $data["data"] =($this->get("app.calendars")->getCalendarById($workspace_id, $calendar_id));

        return new JsonResponse($data);

    }
}
