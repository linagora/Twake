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
        //TODO
        $application = $this->get("api.v1.check")->check($request);
        if(!$application){
            return new JSonResponse(); //TODO error
        }
        if(!$this->get("api.v1.check")->isAllowedTo($application,"calendar:manage")){
            //return error
        }
        $content = this->get("aî.v1.check")->get($request);

        if($content === false ){
            return new JsonResponse($request["errors"]);
        }

        
        if (isset($request["errors"])) {
            return new JsonResponse($request["errors"]);
        }

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $calendar = $this->get("app.calendars") ;
        if(!$calendar){
            $date["error"][] = 3001;
        }else{
            $data["data"]["title"] // TODO ;
        }
        return new JsonResponse($data);
        /**
         *

        $workspaceId = $request->request->get("workspaceId");
        $label = $request->request->get("name");
        $color = $request->request->get("color");

        $data['data'] = $this->get("app.calendars")->createCalendar($workspaceId, $label, $color, $this->getUser()->getId());

        return new JsonResponse($data);
         */
    }

    public function deleteCalendar(Request $request){
        //TODO
        //vérif des data
        //verif des droits
        //supprimer de la bd -> cascade pour supprimer les events reliés à ce calendrier
        //return succès si succès, error sinon
        return new JsonResponse($data);

    }

    public function editCalendar(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //edition
        //return l'objet modifié ou error
        return new JsonResponse($data);
    }

    public function getCalendar(Request $request){
        //TODO
        //verifi des datas
        //verif des droits
        //return objet demandé ou error
        return new JsonResponse($data);
    }
}
