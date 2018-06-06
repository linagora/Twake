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
        $title = isset($content["title"])? $content["title"] : 0 ;
        $color = isset($content["color"])? $content["color"] : 0 ;
        $data["data"] = $this->get("app.calendars")->createCalendar($workspace_id, $title, $color, $this->getUser()->getId());
        //$data["data"] = "test";
        return new JsonResponse($data);

    }

    public function deleteCalendarAction(Request $request){
        //TODO
        //vérif des data
        //verif des droits
        //supprimer de la bd -> cascade pour supprimer les events reliés à ce calendrier
        //return succès si succès, error sinon
        //return new JsonResponse($data);

    }

    public function editCalendarAction(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //edition
        //return l'objet modifié ou error
       // return new JsonResponse($data);
    }

    public function getCalendarAction(Request $request){
        //TODO
        //verifi des datas
        //verif des droits
        //return objet demandé ou error
       // return new JsonResponse($data);
    }
}
