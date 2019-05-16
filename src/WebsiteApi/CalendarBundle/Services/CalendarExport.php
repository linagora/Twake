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

    public function generateToken($request){
        error_log("generateTokenSerivce");

        $user_id = $request->request->get('user_id');
        $workspace_id = $request->request->get('workspace_id');
        $calendars =$request->request->get('calendars');
        $token = bin2hex(random_bytes(32));

        //Insert to export_token table
        $entity = new ExportToken($user_id, $workspace_id, $calendars, $token);
        $this->doctrine->persist($entity);
        $this->doctrine->flush();
//
//        $entity = $this->doctrine->getRepository("TwakeCalendarBundle:ExportToken")->findOneBy(Array("user_id" =>$user_id ));
//
//        error_log(print_r($entity,true));

    }

    public function exportCalendar($request){
        $vCalendar = new Component\Calendar('twakeapp.com');
        $token = $request->request->get("token");
        $entity = $this->doctrine->getRepository("TwakeCalendarBundle:ExportToken")->findOneBy(Array("user_token" =>$token ));

        if ($entity){
            $options = Array();
            $calendars = $entity->getCalendars();
            $mine = $calendars->get("mine");
            if ($mine){
                $options[] = Array("mode" => "user",
                    "calendar_list" => $calendars->get("calendar_list"),
                    "after_ts" => date("U",strtotime("-2 months")),
                    "before_ts" => date("U",strtotime("+10 months")));
            }else{
                $options[] = Array("mode" => "workspace",
                    "calendar_list" => $calendars->get("calendar_list"),
                    "after_ts" => date("U",strtotime("-2 months")),
                    "before_ts" => date("U",strtotime("+10 months")));
            }

            $user_entity = $this->get("app.users")->getById($entity->getUser(), true);
            $events = $this->calendarEvent->get($options,$user_entity );

            $time_zone = new \DateTimeZone("Etc/UTC");
            date_default_timezone_set("Etc/UTC");

            if($events){
                foreach ($events as $event){
                    $evt = $event->getAsArray();

                    if( isset($evt["from"])){
                        $dateStart= new \DateTime(date("c", (int)$evt["from"]), $time_zone);
                    }else{
                        return (new JsonResponse("Error : Date[from] inset"));
                    }
                    if( isset($evt["to"])){
                        //If allday we need to remove one day because we dont use the normal format
                        $dateEnd = new \DateTime(date("c", (int)$evt["to"]), $time_zone);
                    }else{
                        return (new JsonResponse("Error : Date[to] inset"));
                    }
                    $vEvent = new Component\Event();

                    $vEvent
                        ->setNoTime(isset($evt["all_day"]) ? $evt["all_day"] : false)
                        ->setUseUtc(true)
                        ->setDtStart($dateStart)
                        ->setDtEnd($dateEnd)
                        ->setSummary(isset($evt["title"]) ? $evt["title"] : "")
                        ->setDescription(isset($evt["description"]) ? $evt["description"] : "")
                        ->setLocation(isset($evt["location"]) ? $evt["location"] : "");

                    $vCalendar->addComponent($vEvent);
                }
            }

        }else{
            return new JsonResponse("Errors : Token not found in data-base");
        }

    }




}