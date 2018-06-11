<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 11/06/18
 * Time: 16:14
 */

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use \Eluceo\iCal\Component ;


class exportImport {


    /**
     * see https://github.com/markuspoerschke/iCal
     * @param Request $request
     * @param $workspace_id
     * @param $calendar_id
     * @return string|JsonResponse
     */
    public function generateIcsFileForCalendar($workspace_id, $calendar_id, $user_id){

        $vCalendar = new Component\Calendar('twakeapp.com');

        $data = $this->get("app.calendar_events")->getEventsByCalendar($workspace_id,$calendar_id, null);

        if( $data == null ){
            return new JsonResponse(($this->get("api.v1.api_status")-> getError(4013)));
        }

        foreach ($data as $evt) {

            $vEvent = new Component\Event();

            $evt= $evt["event"];

            $tz  = 'Europe/Paris';
            date_default_timezone_set($tz);

            $dateStart = new \DateTime(date( "c", (int)$evt["from"]));
            $dateEnd = new \DateTime(date( "c", (int)$evt["to"]));

            $vEvent
                ->setDtStart($dateStart)
                ->setDtEnd($dateEnd)
                ->setSummary($evt["title"])
                ->setDescription($evt["description"])
                ->setLocation($evt["location"])
            ;

            $vEvent->setUseTimezone(true);

            $vCalendar->addComponent($vEvent);
        }

        return new Response(
            $vCalendar->render(), 200, array(
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="cal.ics"',
        )); // split sur les \r\n et autres types de prog

    }

    /**
     * see https://github.com/markuspoerschke/iCal
     * @param $workspace_id
     * @param $event_id
     * @return string|JsonResponse
     */
    public function generateIcsFileForEvent($workspace_id, $event_id,$user_id){

        $vCalendar = new Component\Calendar('twakeapp.com');
        $vEvent = new Component\Event();

        $tz  = 'Europe/Paris';
        date_default_timezone_set($tz);

        $data =$this->get("app.calendar_events")->getEventById($workspace_id, $event_id, null);
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