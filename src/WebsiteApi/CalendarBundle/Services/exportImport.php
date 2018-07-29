<?php

namespace WebsiteApi\CalendarBundle\Services;
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 11/06/18
 * Time: 16:14
 */

use ICal\ICal;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use \Eluceo\iCal\Component ;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CalendarBundle\Entity\Calendar;
use WebsiteApi\CalendarBundle\Entity\CalendarEvent;
use WebsiteApi\CalendarBundle\Entity\CalendarExportToken;
use WebsiteApi\CalendarBundle\Model\exportImportInterface;



class exportImport implements exportImportInterface{

    /* @var CalendarEvents $calendarEventService */
    var $calendarEventService;
    var $errorService;
    var $doctrine;
    /* @var Calendars $calendarsService */
    var $calendarsService;

    public function __construct($calendarEventService, $errorService, $doctrine,$calendarService)
    {
        $this->calendarEventService = $calendarEventService;
        $this->calendarService = $calendarService;
        $this->errorService = $errorService;
        $this->doctrine = $doctrine;
    }

    public function generateICsFileWithUrl($workspace_id,$calendar_id,$mine,$from,$to, $user_id){
        $vCalendar = new Component\Calendar('twakeapp.com');

        $calendar_tab = explode(",", $calendar_id);

        if($mine) {
            $events = $this->calendarEventService->getEventsForUser($workspace_id, $from, $to, $user_id);
        }else{
            $events = $this->calendarEventService->getEventsForWorkspace($workspace_id, $from, $to, $calendar_tab, $user_id);
        }

        $tz = new \DateTimeZone("Etc/UTC");
        date_default_timezone_set("Etc/UTC");

        if($events){
            foreach ($events as $event){
                $evt = $event->getAsArray();

                $evt = $evt["event"];
                if( isset($evt["from"])){
                    $dateStart= new \DateTime(date("c", (int)$evt["from"]), $tz);
                }else{
                    return (new JsonResponse($this->errorService->getError(4015)));
                }
                if( isset($evt["to"])){
                    //If allday we need to remove one day because we dont use the normal format
                    $dateEnd = new \DateTime(date("c", (int)$evt["to"] - ((isset($evt["allDay"]) && $evt["allDay"]) ? (60 * 60 * 25) : 0)), $tz);
                }else{
                    return new JsonResponse($this->errorService->getError(4015));
                }

                $vEvent = new Component\Event();

                $vEvent
                    ->setNoTime(isset($evt["allDay"]) ? $evt["allDay"] : false)
                    ->setUseUtc(true)
                    ->setDtStart($dateStart)
                    ->setDtEnd($dateEnd)
                    ->setSummary(isset($evt["title"]) ? $evt["title"] : "")
                    ->setDescription(isset($evt["description"]) ? $evt["description"] : "")
                    ->setLocation(isset($evt["location"]) ? $evt["location"] : "");

                $vCalendar->addComponent($vEvent);
            }
        }

        return new Response(
            $vCalendar->render(), 200, array(
                'Content-Type' => 'application/octet-stream',
                'Content-Description' => 'File Transfer',

                'Content-Disposition' => 'attachment; filename="cal.ics"',

                'Expires' =>  '0',
                'Cache-Control' =>  'must-revalidate',
                'Pragma' => 'public',
            )
        );

    }

    public function updateCalendarsByLink(){
        $calendars = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findBy(Array( ),Array("icsLink" => "NOT NULL"));

        foreach ($calendars as $calendar){
            /* @var Calendar $calendar */
            $this->importCalendarByLink(0,$calendar->getIcsLink());
        }
    }

    public function importCalendarByLink($workspaceId, $icsLink, $color = null, $currentUserId=null){
        if(strpos($icsLink,"http")!=0)
            return false;
        $ical = new ICal(file_get_contents($icsLink), array(
            'defaultSpan' => 2,     // Default value
            'defaultTimeZone' => 'UTC',
            'defaultWeekStart' => 'MO',  // Default value
            'disableCharacterReplacement' => false, // Default value
            'skipRecurrence' => false, // Default value
            'useTimeZoneWithRRules' => false, // Default value
        ));

        $title = $ical->calendarName();

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findOneBy($icsLink);
        $eventsArray = $this->buildEventArrayFromICal($ical);

        if(!$calendar) {
            if($color==null)
                $color = "#F00";
            $calendar = $this->calendarsService->createCalendar($workspaceId,$title,$color,$currentUserId,$icsLink);

            foreach ($eventsArray as $eventArray) {
                $result = $this->calendarEventService->createEvent($workspaceId, $calendar->getId(), $eventArray[0], $currentUserId, false, $eventArray[1]);
            }
        }
        else {
            if($color==null)
                $color =  $calendar->getColor();
            $this->calendarsService->updateCalendar($workspaceId, $calendar->getId(), $title, $color, $currentUserId);

            $savedEvents = $this->calendarEventService->getEventsByCalendar($workspaceId,$calendar->getId(),$currentUserId);

            $indexedSavedEvent = Array();

            foreach ($savedEvents as $savedEvent){
                /* @var CalendarEvent $savedEvent */
                $eventArray = $savedEvent->getEvent();

                if(isset($eventArray['uid']))
                    $indexedSavedEvent[$eventArray['uid']] = $savedEvent;
            }

            foreach ($eventsArray as $eventArray) {
                if(isset($indexedSavedEvent[$eventArray["uid"]])) {
                    $eventId = $indexedSavedEvent[$eventArray["uid"]]->getId();
                    $this->calendarEventService->updateEvent($workspaceId, $calendar->getId(), $eventId, $eventArray, $currentUserId);
                }
                else{
                    $this->calendarEventService->createEvent($workspaceId,$calendar->getID(),$eventArray,$currentUserId,false,$eventArray["participants"]);
                }
            }
        }

        return $calendar;
    }

    private function buildEventArrayFromICal(ICal $ical){
        $events = $ical->events();

        $tz = new \DateTimeZone($ical->calendarTimeZone());
        $count = 1;

        $eventsArray = [];
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

            $eventCreate["ui"] = $evt->uid;

            isset($evt->location)? $eventCreate["location"] = $evt->location : null ;
            isset($evt->description)? $eventCreate["description"] = $evt->description : null;

            $eventCreate["participants"] = $participants;

            $eventsArray[$evt->uid] = $eventCreate;
        }

        return $eventsArray;
    }

    function parseCalendar( $workspace_id, $calendar_id)
    {

        try {

            $ical = new ICal($_FILES["file"]["tmp_name"], array(
                'defaultSpan' => 2,     // Default value
                'defaultTimeZone' => 'UTC',
                'defaultWeekStart' => 'MO',  // Default value
                'disableCharacterReplacement' => false, // Default value
                'skipRecurrence' => false, // Default value
                'useTimeZoneWithRRules' => false, // Default value
            ));
            // $ical->initFile('ICal.ics');
            // $ical->initUrl('https://raw.githubusercontent.com/u01jmg3/ics-parser/master/examples/ICal.ics');

        } catch (\Exception $e) {
            die($e);
        }

        $events = $this->buildEventArrayFromICal($ical);

        foreach ($events as $evt){
            $result = $this->calendarEventService->createEvent($workspace_id, $calendar_id, $evt, null, false, $evt["participants"]);

            //   var_dump($eventCreate);
            if ($result == false || $result == null) {
                $data = $this->errorService->getError(4001);
                $data["data"] = "";
            } else {
                $data = $this->errorService->getSuccess();
                $data["data"] = $result;
            }

        }

        return new JsonResponse($ical->events());


    }

    public function generateCalendarExportToken($workspaceId,$calendarsIds,$useMine,$from,$to, $user_id){
        if($user_id==null)
            $user_id = 0;
        $calendarExportToken = new CalendarExportToken(intval($workspaceId),$calendarsIds,intval($useMine),$from,$to, $user_id);
        $token = $calendarExportToken->getToken();
        $this->doctrine->persist($calendarExportToken);
        $this->doctrine->flush();

        return $token;
    }

    public function generateIcsFileForCalendarFromToken($token){
        /* @var CalendarExportToken $calendarExportToken */
        $calendarExportToken = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarExportToken")->findOneBy(Array("token"=>$token));
        return $this->generateICsFileWithUrl(
            $calendarExportToken->getWorkspaceId(),
            $calendarExportToken->getCalendarsIds(),
            $calendarExportToken->getUseMine(),
            date("U") - 60 * 60 * 24 * 30,
            max($calendarExportToken->getTo(), date("U") + 60 * 60 * 24 * 30 * 2),
            $calendarExportToken->getUserId()
        );
    }

}