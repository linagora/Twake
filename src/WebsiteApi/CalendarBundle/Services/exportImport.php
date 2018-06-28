<?php

namespace WebsiteApi\CalendarBundle\Services;
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 11/06/18
 * Time: 16:14
 */

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use \Eluceo\iCal\Component ;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CalendarBundle\Model\exportImportInterface;



class exportImport implements exportImportInterface{

    var $calendarEventService;
    var $errorService;

    public function __construct($calendarEventService, $errorService)
    {
        $this->calendarEventService = $calendarEventService;
        $this->errorService = $errorService;
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
                $vEvent = new Component\Event();
                error_log("pouet");
                $evt = $event->getAsArray();
                var_dump($evt);

                $evt = $evt["event"];
                if( isset($evt["from"])){
                    $dateStart= new \DateTime(date("c", (int)$evt["from"]), $tz);
                }else{
                    return (new JsonResponse($this->errorService->getError(4015)));
                }
                if( isset($evt["to"])){
                    $dateEnd = new \DateTime(date("c", (int)$evt["to"]), $tz);
                }else{
                    return new JsonResponse($this->errorService->getError(4015));
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
        }
        return new Response(
            $vCalendar->render(), 200, array(
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="cal.ics"',
        ));

    }
    /**
     * see https://github.com/markuspoerschke/iCal
     */
    public function generateIcsFileForCalendar($workspace_id, $calendar_id)
    {

        $vCalendar = new Component\Calendar('twakeapp.com');

        $data = $this->calendarEventService->getEventsByCalendar($workspace_id, $calendar_id, null);

        if ($data == null) {
            return new JsonResponse(($this->errorService->getError(4013)));
        }

        $tz = new \DateTimeZone("Etc/UTC");

        date_default_timezone_set("Etc/UTC");

        foreach ($data as $evt) {

            $vEvent = new Component\Event();

            $evt = $evt["event"];

            if( isset($evt["from"])){
                $dateStart = new \DateTime(date("c", (int)$evt["from"]), $tz);
            }else{
                return (new JsonResponse($this->errorService->getError(4015)));
            }
            if(isset($evt["to"])){
                $dateEnd =  new \DateTime(date("c", (int)$evt["to"]), $tz);
            }else{
                return new JsonResponse($this->errorService->getError(4015));
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



    function parseCalendar( $workspace_id, $calendar_id)
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
            // $ical->initUrl('https://raw.githubusercontent.com/u01jmg3/ics-parser/master/examples/ICal.ics');

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

            $result = $this->calendarEventService->createEvent($workspace_id, $calendar_id, $eventCreate, null, false, $participants);

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
    /**
     * see https://github.com/markuspoerschke/iCal
     */
    public function generateIcsFileForEvent($workspace_id, $event_id){

        $vCalendar = new Component\Calendar('twakeapp.com');
        $vEvent = new Component\Event();

        $tz  = 'Europe/Paris';
        date_default_timezone_set($tz);

        $data =$this->calendarEventService->getEventById($workspace_id, $event_id, null);
        $event = $data["event"];

        $dateStart = new \DateTime(date( "c", (int)$event["from"]));
        // $dateStart = (new \DateTime($event["start"]));
        $dateEnd = new \DateTime(date("c",(int)$event["to"]));
        //$dateEnd = new \DateTime($event["end"]);

        $vEvent
            ->setDtStart($dateStart)
            ->setDtEnd($dateEnd)
            ->setSummary($event["title"])
            ->setDescription($event["description"])
            ->setLocation($event["location"])

        ;
        $vEvent->setUseTimezone(true);


        $vCalendar->addComponent($vEvent);

        return new Response(
            $vCalendar->render(), 200, array(
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="cal.ics"',
        )); // split sur les \r\n et autres types de prog

    }

}