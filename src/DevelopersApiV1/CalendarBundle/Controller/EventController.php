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

    public function createEventAction(Request $request,$workspace_id,$calendar_id){
        $application = $this->get("api.v1.check")->check($request);
        if(!$application){
            return new JSonResponse(); //TODO error
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
        $event = isset($content["event"])? $content["event"] : 0 ;
        $addMySelf = isset($content["addMe"])? $content["event"] : 0;

        $event = $this->get("app.calendar_events")->createEvent($workspace_id, $calendar_id, $event, $this->getUser()->getId(), $addMySelf);

        if($event){
            $data['data'] = $event->getAsArray();
        }




        return new JsonResponse($data);

    }

    public function deleteEventAction(Request $request){
        //TODO
        //verfi des datas
        //verif des droits
        //delete event
        //return succes ou error
    }

    public function editEventAction(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //edit
        //return event modifié ou error
    }

    public function getEventAction(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //return event ou error
    }
}
