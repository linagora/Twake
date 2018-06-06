<?php

namespace DevelopersApiV1\CalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class CalendarController extends Controller
{
    public function indexAction()
    {
        return $this->render('CalendarBundle:Default:index.html.twig');
    }

    public function createCalendar(Request $request){
        $application = $________________->check($request);
        $array = $this->get("api.CheckRightApplication")->getRequestData($request);
        //TODO

    }

    public function deleteCalendar(Request $request){
        //TODO
    }

    public function editCalendar(Request $request){
        //TODO
    }

    public function getCalendar(Request $request){
        //TODO
    }
}
