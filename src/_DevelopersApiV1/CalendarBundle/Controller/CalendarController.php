<?php

namespace DevelopersApiV1\CalendarBundle\Controller;

use DevelopersApiV1\CoreBundle\Services\ApiStatus;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use \Eluceo\iCal\Component ;
use ICal\ICal;


class CalendarController extends Controller
{

    /**
     * Create a calendar from api and return the json object if success or error log if fail
     * By default the color is pink and the title is "MyCalendar"
     * @param Request $request
     * @param $workspace_id
     * @return JsonResponse
     */
    public function createCalendarAction(Request $request, $workspace_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:write", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }


        $title = isset($content["title"]) ? $content["title"] : "MyCalendar";
        $color = isset($content["color"]) ? $content["color"] : "pink";

        $result = ($this->get("app.calendars")->createCalendar($workspace_id, $title, $color, null))->getAsArray();

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4001);
            $data["data"] = "";
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);
    }

    /**
     * Delete a calendar from the api, return a sucess log or an error log if fail
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @return JsonResponse
     */
    public function deleteCalendarAction(Request $request, $workspace_id, $calendar_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $result = ($this->get("app.calendars")->removeCalendar($workspace_id, $calendar_id, null));

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4002);
            $data["data"] = "";
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = "";
        }

        return new JsonResponse($data);
    }

    /**
     * Edit a calendar from the api, if a field is not specified it keeps the old value.
     * Return the json object if success or a log error if fail
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @return JsonResponse
     */
    public function editCalendarAction(Request $request, $workspace_id, $calendar_id)
    {

        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $olderData = $this->get("app.calendars")->getCalendarById($workspace_id, $calendar_id);

        $title = isset($content["title"]) ? $content["title"] : $olderData["name"];
        $color = isset($content["color"]) ? $content["color"] : $olderData["color"];

        $result = ($this->get("app.calendars")->updateCalendar($workspace_id, $calendar_id, $title, $color, null))->getAsArray();

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4003);
            $data["data"] = "";
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);
    }

    /**
     * Get a calendar from the api, return the json object if success, an error log if fail
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @return JsonResponse
     */
    public function getCalendarAction(Request $request, $workspace_id, $calendar_id)
    {
        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:read", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $result = ($this->get("app.calendars")->getCalendarById($workspace_id, $calendar_id));

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4004);
            $data["data"] = "";
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);

    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @return JsonResponse
     */
    public function getAllCalendarAction(Request $request, $workspace_id)
    {
        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:read", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);

        if ($content === false) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(4000));
        }

        $result = ($this->get("app.calendars")->getCalendars($workspace_id));

        if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4014);
            $data["data"] = "";
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);

    }

    /**
     * Share a calendar between two workspaces
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @param $other_workspace_id
     * @return JsonResponse
     */
    public function shareAction(Request $request, $workspace_id, $calendar_id, $other_workspace_id)
    {
        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $error = ($this->get("app.calendars")->shareCalendar($workspace_id, $calendar_id, $other_workspace_id, true, null));

        $result = ($this->get("app.calendars")->getCalendarById($other_workspace_id, $calendar_id));

        if ($error == false || $error == null) {
            $data = $this->get("api.v1.api_status")->getError(4005);
            $data["data"] = "";
        } else if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4004);
            $data["data"] = "";
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);

    }

    /**
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @param $other_workspace_id
     * @return JsonResponse
     */
    public function unshareAction(Request $request, $workspace_id, $calendar_id, $other_workspace_id)
    {
        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $error = ($this->get("app.calendars")->unshareCalendar($workspace_id, $calendar_id, $other_workspace_id, true, null));

        $result = $data["data"] = ($this->get("app.calendars")->getCalendarById($workspace_id, $calendar_id));

        if ($error == false || $error == null) {
            $data = $this->get("api.v1.api_status")->getError(4006);
            $data["data"] = "";
        } else if ($result == false || $result == null) {
            $data = $this->get("api.v1.api_status")->getError(4004);
            $data["data"] = "";
        } else {
            $data = $this->get("api.v1.api_status")->getSuccess();
            $data["data"] = $result;
        }

        return new JsonResponse($data);

    }

    /**
     * see https://github.com/markuspoerschke/iCal
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @return string|JsonResponse
     */
    public function generateIcsFileAction(Request $request, $workspace_id, $calendar_id)
    {
        $application = $this->get("api.v1.check")->check($request);

        if (!$application) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(1));
        }

        if (!$this->get("api.v1.check")->isAllowedTo($application, "calendar:manage", $workspace_id)) {
            return new JSonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $vCalendar = new Component\Calendar('twakeapp.com');

        $data = $this->get("app.calendar_events")->getEventsByCalendar($workspace_id, $calendar_id, null);

        if ($data == null) {
            return new JsonResponse(($this->get("api.v1.api_status")->getError(4013)));
        }

        $tz = new \DateTimeZone("Etc/UTC");

        date_default_timezone_set("Etc/UTC");

        foreach ($data as $evt) {

            $vEvent = new Component\Event();

            $test = false;
            $evt = $evt["event"];

            $dateStart = isset($evt["from"]) ? new \DateTime(date("c", (int)$evt["from"]), $tz) : $test = new JsonResponse($this->get("api.v1.api_status")->getError(4015));
            $dateEnd = isset($evt["to"]) ? new \DateTime(date("c", (int)$evt["to"]), $tz) : $test = new JsonResponse($this->get("api.v1.api_status")->getError(4015));

            if ($test != false) {
                return $test;
            }

            $vEvent
                ->setDtStart($dateStart)
                ->setDtEnd($dateEnd)
                ->setSummary($evt["title"])
                ->setDescription($evt["description"])
                ->setLocation($evt["location"]);

            $vEvent->setUseTimezone(true);

            $vCalendar->addComponent($vEvent);
        }

        return new Response(
            $vCalendar->render(), 200, array(
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="cal.ics"',
        )); // split sur les \r\n et autres types de prog

    }

    function parseCalendarAction(Request $request, $workspace_id, $calendar_id)
    {

        try {

            $ical = new ICal('ICal.ics', array(
                'defaultSpan' => 2,     // Default value
                'defaultTimeZone' => 'UTC',
                'defaultWeekStart' => 'MO',  // Default value
                'disableCharacterReplacement' => false, // Default value
                'skipRecurrence' => false, // Default value
                'useTimeZoneWithRRules' => false, // Default value
            ));
            // $ical->initFile('ICal.ics');
            // $ical->initUrl("https://raw.githubusercontent.com/u01jmg3/ics-parser/master/examples/ICal.ics");

        } catch (\Exception $e) {
            die($e);
        }
        $forceTimeZone = false;
        $tz = new \DateTimeZone($ical->calendarTimeZone());

        $count = 1;

        $events = $ical->events();
        foreach ($events as $evt){

            $eventCreate = Array();
            $participants = Array(); //improvment : link mail with user id if exist and add it in participants array

            $dt = new \DateTime($evt->dtstart,$tz);
            $eventCreate["from"] = $dt->getTimestamp();

            $eventCreate["start"] = $dt->format(DATE_W3C);

            $dt2 = new \DateTime($evt->dtend,$tz);
            $eventCreate["to"] = $dt2->getTimestamp();

            $eventCreate["end"] = $dt2->format(DATE_W3C);

            $eventCreate["title"] = isset($evt->summary)? $evt->summary : "Event ".$count++;

            isset($evt->location)? $eventCreate["location"] = $evt->location : null ;
            isset($evt->description)? $eventCreate["description"] = $evt->description : null;

            $result = $this->get("app.calendar_events")->createEvent($workspace_id, $calendar_id, $eventCreate, null, false, $participants);

         //   var_dump($eventCreate);
            if ($result == false || $result == null) {
                $data = $this->get("api.v1.api_status")->getError(4001);
                $data["data"] = "";
            } else {
                $data = $this->get("api.v1.api_status")->getSuccess();
                $data["data"] = $result;
            }

        }

        return new JsonResponse($ical->events());


    }
}
