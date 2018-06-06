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

    public function createEvent(Request $request){
        //TODO
        //verif des datas
        //creation de l'event par rappoort au calendar du workspzce
        //return event créé ou error
    }

    public function deleteEvent(Request $request){
        //TODO
        //verfi des datas
        //verif des droits
        //delete event
        //return succes ou error
    }

    public function editEvent(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //edit
        //return event modifié ou error
    }

    public function getEvent(Request $request){
        //TODO
        //verif des datas
        //verif des droits
        //return event ou error
    }
}
