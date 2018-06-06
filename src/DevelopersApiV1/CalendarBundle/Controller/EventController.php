<?php
namespace DevelopersApiV1\CalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class EventController extends Controller
{
    public function indexAction()
    {
        return $this->render('CalendarBundle:Default:index.html.twig');
    }

    /**
     *
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @return JsonResponse
     */
    public function createEventAction(Request $request,$workspace_id,$calendar_id){
        $application = $this->get("api.v1.check")->check($request);
        if(!$application){
            return new JSonResponse();
        }
        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage")){
            return new JSonResponse();
        }
        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse();
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $event = Array() ;
        $event["from"] = isset($content["from"])? $content["from"]: 0 ;
        $event["to"] = isset($content["event"])? $content["to"]: 0 ;
        $participants = Array();

        $data["data"] = $this->get("app.calendar_events")->createEvent($workspace_id, $calendar_id, $event, null, false, $participants);

        if($data["data"]!=null){
            $data["data"] = $data["data"]->getAsArray();
        }
        return new JsonResponse($data);

    }

    public function deleteEventAction(Request $request, $workspace_id, $event_id, $calendar_id){
        $application = $this->get("api.v1.check")->check($request);
        if(!$application){
            return new JSonResponse("1");
        }
        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage")){
            return new JSonResponse("2");
        }
        $content = $this->get("api.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse("3");
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $data["data"] = $this->get("app.calendar_events")->removeEvent($workspace_id, $calendar_id, $event_id, null);

        return new JsonResponse($data);
    }

    public function editEventAction(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //edit
        //return event modifié ou error
    }

    public function getEventAction(Request $request, $workspace_id, $event_id){

        //TODO
    }

    public function shareAction(Request $request){
        //TODO
    }

    public function unshareAction(Request $request){
        //TODO
    }
}
