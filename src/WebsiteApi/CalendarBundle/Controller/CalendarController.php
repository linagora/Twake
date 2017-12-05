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
            'data' => Array('calendars' => Array())
        );

        $manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {

            $organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id" => $request->request->get("gid"), "isDeleted" => false));


            if ($organization == null) {
                $data["errors"][] = "groupnotfound";
            } elseif (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, "Calendar:general:view")) {
                $data["errors"][] = "notallowed";
                $data["log"] = $organization;
            } else {
                $data['data']['calendars'] = $this->get('app.calendar.CalendarSystem')->getCalendars($request->request->get("gid"));
            }
        }
        return new JsonResponse($data);
    }
    public function createCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array()
        );
        $manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        } else {

            $organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id" => $request->request->get("gid"), "isDeleted" => false));


            if ($organization == null) {
                $data["errors"][] = "groupnotfound";

            } elseif (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, "Calendar:general:create")) {
                $data["errors"][] = "notallowed";
            } else {

                $this->get('app.calendar.CalendarSystem')->createCalendar($request->request->get("gid"),$request->request->get("title"),$request->request->get("description"));
            }
        }
        return new JsonResponse($data);
    }
}