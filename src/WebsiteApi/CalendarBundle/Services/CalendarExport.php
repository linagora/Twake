<?php


namespace WebsiteApi\CalendarBundle\Services;
use ICal\ICal;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use \Eluceo\iCal\Component ;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CalendarBundle\Entity\ExportToken;

class CalendarExport
{

    public function __construct($doctrine, $calendarEvent)
    {
        $this->calendarEvent = $calendarEvent;
        $this->doctrine = $doctrine;
    }

    public function generateToken($request, $current_user = null){
        error_log("generateTokenSerivce");

        $user_id = $current_user->getId();
        $workspace_id = $request->request->get('workspace_id');
//        $calendars =$request->request->get('calendars');
        $calendars = Array("calendar_list" =>
            [Array("calendar_id" => "633ce0c6-77ec-11e9-a8c7-0242ac160002" ,"workspace_id" => "14005200-48b1-11e9-a0b4-0242ac120005" )] ,
            "mine" => true);
        $token = bin2hex(random_bytes(32));

        //Insert to export_token table
        $entity = new ExportToken("c87ffd10-59d8-11e9-bf3f-0242ac120005", "14005200-48b1-11e9-a0b4-0242ac120005", $calendars, $token);
        $this->doctrine->persist($entity);
        $this->doctrine->flush();
//
//        $entity = $this->doctrine->getRepository("TwakeCalendarBundle:ExportToken")->findOneBy(Array("user_id" =>$user_id ));
//
//        error_log(print_r($entity,true));

    }

    public function exportCalendar($token){
//        $entity = $this->doctrine->getRepository("TwakeCalendarBundle:ExportToken")->findBy(Array());
//        foreach ($entity as $en){
//            error_log(print_r($en,true));
//        }


        $entity = $this->doctrine->getRepository("TwakeCalendarBundle:ExportToken")->findOneBy(Array("user_token" =>$token ));
        if ($entity) {
            error_log("if entity");
            $vCalendar = new Component\Calendar('twakeapp.com');
            $options = Array();
            $calendars = $entity->getCalendars();
            $mine = $calendars["mine"];
            if (!$mine) {
                $options = Array("mode" => "user",
                    "calendar_list" => "",
                    "after_ts" => date("U", strtotime("-2 months")),
                    "before_ts" => date("U", strtotime("+10 months")));
            } else {
                $options = Array("mode" => "workspace",
                    "calendar_list" => $calendars["calendar_list"],
                    "after_ts" => date("U", strtotime("-2 months")),
                    "before_ts" => date("U", strtotime("+10 months")));
            }
            $user_entity = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $entity->getUserId()));


            $events = $this->calendarEvent->get($options, $user_entity);
            $time_zone = new \DateTimeZone("Etc/UTC");
            date_default_timezone_set("Etc/UTC");

            if ($events) {
                error_log("ifEvents");
                foreach ($events as $evt) {

                    if (isset($evt["from"])) {
                        $dateStart = new \DateTime(date("c", (int)$evt["from"]), $time_zone);
                    } else {
                        return (new JsonResponse("Error : Date[from] inset"));
                    }
                    if (isset($evt["to"])) {
                        //If allday we need to remove one day because we dont use the normal format
                        $dateEnd = new \DateTime(date("c", (int)$evt["to"]), $time_zone);
                    } else {
                        return (new JsonResponse("Error : Date[to] inset"));
                    }
                    $vEvent = new Component\Event();
//                    $rrule = $evt["repetition_definition"]["rrule"];
                    $rrule = 'DTSTART:20120201T103000Z\nRRULE:FREQ=WEEKLY;INTERVAL=5;UNTIL=20120601;BYDAY=MO,FR';
                    $rrule = explode("nRRULE",$rrule)[1];

                    foreach (explode(";", $rrule) as $parameter){
                        $data = explode("=", $parameter);
                        $properties["key"][] = $data[0];
                        $properties["value"][] = $data[1];
                    }
                    $freq = $properties["value"][0];
                    $interval = $properties["value"][1];
                    $until = $properties["value"][2];
                    $stdRecurrenceRule = new \Eluceo\iCal\Property\Event\RecurrenceRule();

                    switch ($freq){
                        case "WEEKLY" :
                            $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_WEEKLY);
                            break;
                        case "YEARLY" :
                            $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_YEARLY);
                            break;
                        case "MONTHLY" :
                            $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_MONTHLY);
                            break;
                        case "DAILY" :
                            $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_DAILY);
                            break;
                        case "HOURLY" :
                            $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_HOURLY);
                            break;
                        case "MINUETELY" :
                            $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_MINUETELY);
                            break;
                        case "SECONDLY" :
                            $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_SECONDLY);
                            break;
                    }


                    $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_WEEKLY);
                    $stdRecurrenceRule->setUntil(new \DateTime(date("c", (int)$until), $time_zone));
                    $stdRecurrenceRule->setInterval($interval);

                    switch ($properties["key"][3]){
                        case "BYDAY" : $stdRecurrenceRule->setByDay($properties["value"][3]);
                            break;
                        case "BYMONTH" : $stdRecurrenceRule->setByMonth($properties["value"][3]);
                            break;
                        case "BYYEARDAY" : $stdRecurrenceRule->setByYearDay($properties["value"][3]);
                            break;
                        case "BYWEEKNO" : $stdRecurrenceRule->setByWeekNo($properties["value"][3]);
                            break;
                        case "BYMONTHDAY" : $stdRecurrenceRule->setByMonthDay($properties["value"][3]);
                            break;
                        case "BYHOUR" : $stdRecurrenceRule->setByHour($properties["value"][3]);
                            break;
                        case "BYMINUTE" : $stdRecurrenceRule->setByMinute($properties["value"][3]);
                            break;
                        case "BYSECOND" : $stdRecurrenceRule->setBySecond($properties["value"][3]);
                            break;
                    }


                    $vEvent
                        ->setNoTime(isset($evt["all_day"]) ? $evt["all_day"] : false)
                        ->setUseUtc(true)
                        ->setDtStart($dateStart)
                        ->setDtEnd($dateEnd)
                        ->setSummary(isset($evt["title"]) ? $evt["title"] : "")
                        ->setDescription(isset($evt["description"]) ? $evt["description"] : "")
                        ->setDuration($evt["repetition_definition"]["duration"])
                        ->setLocation(isset($evt["location"]) ? $evt["location"] : "");
//                        ->setRecurrenceRule($stdRecurrenceRule);

                    $vCalendar->addComponent($vEvent);
                }

                    error_log(print_r($vEvent->getRecurrenceRule(),true));

//                return new Response("fichier ics");
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
            }else{
                return new JsonResponse("Errors : Events not found in data-base");
            }
        }else
            return new JsonResponse("Errors : Token not found in data-base");


    }




}