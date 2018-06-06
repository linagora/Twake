<?php
namespace DevelopersApiV1\CalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class EventController extends Controller
{
    public function indexAction()
    {
        return $this->render('CalendarBundle:Default:index.html.twig');
    }

    public function createEvent(Request $request){
        //TODO
    }

    public function deleteEvent(Request $request){
        //TODO
    }

    public function editEvent(Request $request){
        //TODO
    }

    public function getEvent(Request $request){
        //TODO
    }
}
