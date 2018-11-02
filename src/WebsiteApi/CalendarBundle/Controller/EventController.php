<?php

namespace WebsiteApi\CalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class EventController extends Controller
{


    public function getAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );
        $useMine = $request->request->get("mine");
        $forUser  = $request->request->get("forUser", null);
        $workspaceId = $request->request->getInt("workspaceId");
        $to = $request->request->get("to");
        $from = $request->request->get("from", 0);
        $calendarsIds = $request->request->get("calendarsIds");

        if ($useMine && !$forUser) {
            $events = $this->get("app.calendar_events")->getEventsForUser($workspaceId, $from, $to, $this->getUser()->getId());
        }else if($forUser){
            $events = $this->get("app.calendar_events")->getEventsForOtherUser($workspaceId, $from, $to, $this->getUser()->getId(),$forUser);
        }
        else{
            $events = $this->get("app.calendar_events")->getEventsForWorkspace($workspaceId, $from, $to, $calendarsIds, $this->getUser()->getId());
        }

        if($events){
            $events_formated = Array();
            foreach ($events as $event){
                if (!is_array($event)) {
                    $events_formated[] = $event->getAsArray();
                } else {
                    $events_formated[] = $event;
                }
            }
            $data["data"] = $events_formated;
        }

        return new JsonResponse($data);
    }
    public function getOneEventAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );
        $eventId = $request->request->get("eventId");
        $workspaceId = $request->request->getInt("workspaceId");

        $event = $this->get("app.calendar_events")->getEvent($eventId, $workspaceId, $this->getUser()->getId());

        if($event){
            $data["data"] = $event->getAsArray();
        }

        return new JsonResponse($data);
    }


    public function createAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $event = $request->request->get("event");
        $calendarId = $request->request->getInt("calendarId", 0);
        $appId = $request->request->getInt("appId", 0);
        $addMySelf = $request->request->get("addMe");
        $participants = $event["participant"];

        if (!$calendarId && $appId) {
            $calendarId = $this->get("app.calendar_events")->getCalendarForApp($workspaceId, $appId, $this->getUser()->getId());
            if ($calendarId) {
                $calendarId = $calendarId->getId();
            }
        }

        $event = $this->get("app.calendar_events")->createEvent($workspaceId, $calendarId, $event, $this->getUser()->getId(), $addMySelf, $participants);

        if($event == null){
            $data["errors"] = "error";
        }
        else{
            $data['data'] = $event->getAsArray();
        }

        return new JsonResponse($data);
    }

    public function updateAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $eventId = $request->request->get("eventId");
        $event = $request->request->get("event");
        $calendarId = $request->request->get("calendarId");

        $data['data'] = $this->get("app.calendar_events")->updateEvent($workspaceId, $calendarId, $eventId, $event, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function removeAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $eventId = $request->request->get("eventId");
        $calendarId = $request->request->get("calendarId");

        $data['data'] = $this->get("app.calendar_events")->removeEvent($workspaceId, $calendarId, $eventId, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function addUsersAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $eventId = $request->request->get("eventId");
        $calendarId = $request->request->get("calendarId");
        $usersId = $request->request->get("usersId");

        $data['data'] = $this->get("app.calendar_events")->addUsers($workspaceId, $calendarId, $eventId, $usersId, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function removeUsersAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $eventId = $request->request->get("eventId");
        $calendarId = $request->request->get("calendarId");
        $usersId = $request->request->get("usersId");

        $data['data'] = $this->get("app.calendar_events")->removeUsers($workspaceId, $calendarId, $eventId, $usersId, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function getUsersAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $eventId = $request->request->get("eventId",0);

        $data['data'] = $this->get("app.calendar_events")->getUsers( $eventId, $this->getUser()->getId());

        return new JsonResponse($data);
    }
}