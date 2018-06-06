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

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage")){
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

        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage")){
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

    public function editCalendarAction(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //edition
        //return l'objet modifié ou error
       // return new JsonResponse($data);
    }

    public function getCalendarAction(Request $request, $workspace_id, $calendar_id){
        $application = $this->get("api.v1.check")->check($request);
        if(!$application){
            return new JSonResponse("application");
        }
        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage")){
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

    public function shareAction(Request $request){
        //TODO
    }

    public function unshareACtion(Request $request){
        //TODO
    }
}
