<?php

namespace WebsiteApi\CalendarBundle\Controller;

use phpDocumentor\Reflection\Types\Array_;
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

        if ($calendars){
            $data['data'] = $calendars;
        }

        return new JsonResponse($data);
    }

    public function getAutoParticipateByCalendar(Request $request){
        $data = Array(
            'error' => Array(),
            'data' => Array()
        );
        $workspaceId = $request->request->get("workpsaceId");
        $calendarId = $request->request->get("calendarId");
        $calendar = ($this->get("app.calendars")->getCalendarById($workspaceId,$calendarId))->getAsArray();

        $data['data'] = $calendar["autoParticpate"] ;
        return new JsonResponse($data);
    }
    public function createCalendarAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $label = $request->request->get("name");
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
        $label = $request->request->get("name");
        $color = $request->request->get("color");
        $autoParticipant = $request->get("autoParticipate");

        $data['data'] = $this->get("app.calendars")->updateCalendar($workspaceId, $calendarId, $label, $color, $this->getUser(), $autoParticipant);

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

        $linkCalendars = $this->get("app.calendars")->getCalendarShare($workspaceId, $calendarId, $this->getUser()->getId());

        $calendars_formated = Array();
        foreach ($linkCalendars as $calendar){
            if($calendar->getWorkspace() != null){
                $calendars_formated[] = $calendar->getWorkspace()->getAsArray();
            }

        }
        $data['data'] = $calendars_formated;

        return new JsonResponse($data);
    }

    public function importCalendarAction(Request $request){

        $workspaceID = $_POST["workspaceId"];
        $calendarId = $_POST["calendarId"];
        $parsing = $this->get("app.export_import")->parseCalendar($workspaceID,$calendarId);
        return $parsing;
    }

    public function exportCalendarAction(Request $request, $workspaceId, $calendarsIds, $useMine, $from, $to){
        if($useMine==1){
            $user_id = $this->getUser()->getId();

        }else{
            $user_id = null;
        }
        $from = ($from>=(strtotime('-1 year', (new \DateTime())->getTimestamp())) && $from <=strtotime('-1 year', (new \DateTime())->getTimestamp())) ? $from : (new \DateTime())->getTimestamp();
        $to = ($to<=(strtotime('-1 year', (new \DateTime())->getTimestamp())) && $to>=strtotime('+1 year', (new \DateTime())->getTimestamp())) ? $to : strtotime('+1 year', (new \DateTime())->getTimestamp()) ;

        $parsing = $this->get("app.export_import")->generateIcsFileWithUrl($workspaceId,$calendarsIds,$useMine,$from,$to, $user_id);
        return $parsing;
    }

    public function exportCalendarWithTokenAction(Request $request, $token){
        return $this->get("app.export_import")->generateIcsFileForCalendarFromToken($token);
    }

    public function getCalendarExportTokenAction(Request $request, $workspaceId, $calendarsIds, $useMine, $from, $to){
        $data = Array(
            'errors' => Array()
        );

        if($useMine==1){
            $user_id = $this->getUser()->getId();

        }else{
            $user_id = null;
        }
        $from = ($from>=(strtotime('-1 year', (new \DateTime())->getTimestamp())) && $from <=strtotime('-1 year', (new \DateTime())->getTimestamp())) ? $from : (new \DateTime())->getTimestamp();
        $to = ($to<=(strtotime('-1 year', (new \DateTime())->getTimestamp())) && $to>=strtotime('+1 year', (new \DateTime())->getTimestamp())) ? $to : strtotime('+1 year', (new \DateTime())->getTimestamp()) ;

        $token = $this->get("app.export_import")->generateCalendarExportToken($workspaceId,$calendarsIds,$useMine,$from,$to, $user_id);

        $data["data"] = $token;

        return new JsonResponse($data);
    }

}