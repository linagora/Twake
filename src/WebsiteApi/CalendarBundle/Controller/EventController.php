<?php

namespace WebsiteApi\CalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class EventController extends Controller
{
    public function getEventsByCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array('events' => Array())
        );

        $manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            $data['data']['events'] = $this->get('app.event.EventSystem')->getEventsByCalendar($request->request->get("cid"));
        }
        return new JsonResponse($data);
    }
    public function getEventsByOwnerAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array('events' => Array())
        );

        $manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            $data['data']['events'] = $this->get('app.event.EventSystem')->getEventsByOwner($request->request->get("uid"));
        }
        return new JsonResponse($data);
    }
    public function createEventAction(Request $request)
    {
        $data = Array(
            'errors' => Array()
        );
        $manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        } else {
                $this->get('app.event.EventSystem')->createEvent($request->request->get("uid"),$request->request->get("title"),$request->request->get("sDate"),$request->request->get("eDate"),$request->request->get("description"),$request->request->get("location"),$request->request->get("color"),$request->request->get("cid"));
        }
        return new JsonResponse($data);
    }
}