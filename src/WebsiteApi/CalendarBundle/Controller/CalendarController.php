<?php

namespace WebsiteApi\CalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class CalendarController extends Controller
{

    public function getCalendarsAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");

        $calendars = $this->get("app.calendars")->getCalendars($workspaceId, $this->getUser()->getId());

        $calendars_formated = Array();
        foreach ($calendars as $calendar){
            $calendars_formated = $calendar->getAsArray();
        }
        $data['data'] = $calendars_formated;

        return new JsonResponse($data);
    }

    public function createCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $label = $request->request->get("label");
        $color = $request->request->get("color");

        $data['data'] = $this->get("app.calendars")->createCalendar($workspaceId, $label, $color, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function updateCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $calendarId = $request->request->get("calendarId");
        $label = $request->request->get("label");
        $color = $request->request->get("color");

        $data['data'] = $this->get("app.calendars")->updateCalendar($workspaceId, $calendarId, $label, $color, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function removeCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $calendarId = $request->request->get("calendarId");

        $data['data'] = $this->get("app.calendars")->removeCalendar($workspaceId, $calendarId, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function shareCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $hasAllRights = $request->request->get("hasAllRights");
        $other_workspaceId = $request->request->get("otherWorkspaceId");
        $calendarId = $request->request->get("calendarId");

        $data['data'] = $this->get("app.calendars")->shareCalendar($workspaceId, $calendarId, $other_workspaceId, $hasAllRights, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function unshareCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $other_workspaceId = $request->request->get("otherWorkspaceId");
        $calendarId = $request->request->get("calendarId");

        $data['data'] = $this->get("app.calendars")->unshareCalendar($workspaceId, $calendarId, $other_workspaceId, $this->getUser()->getId());


        return new JsonResponse($data);
    }

    public function getShareCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $calendarId = $request->request->get("calendarId");

        $calendars = $this->get("app.calendars")->getCalendarShare($workspaceId, $calendarId, $this->getUser()->getId());

        $calendars_formated = Array();
        foreach ($calendars as $calendar){
            $calendars_formated = $calendar->getAsArray();
        }
        $data['data'] = $calendars_formated;

        return new JsonResponse($data);
    }

}