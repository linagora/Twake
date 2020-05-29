<?php


namespace Twake\Calendar\Services;

use App\App;
use Eluceo\iCal\Component;
use Common\Http\Response;
use Twake\Calendar\Entity\ExportToken;

class CalendarExport
{

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
    }

    public function generateToken($request, $current_user = null)
    {

        $user_id = $current_user->getId();
        $workspace_id = $request->request->get('workspace_id');
        $calendars = $request->request->get('calendars');

        if ($workspace_id && ($calendars["mode"] == "both" || $calendars["mode"] == "workspace")) {
            if (!isset($calendars["calendar_list"]) || !$calendars["calendar_list"] || count($calendars["calendar_list"]) == 0) {
                $calendars["calendar_list"] = [];
                $calendars_entities = $this->doctrine->getRepository("Twake\Calendar:Calendar")->findBy(Array("workspace_id" => $workspace_id));
                foreach ($calendars_entities as $calendar_entity) {
                    $calendars["calendar_list"][] = ["workspace_id" => $workspace_id, "calendar_id" => $calendar_entity->getId()];
                }
            }
        }

        $token = bin2hex(random_bytes(64));

        $entity = new ExportToken($user_id, $workspace_id, $calendars, $token);
        $this->doctrine->persist($entity);
        $this->doctrine->flush();

        return $token;

    }


    public function exportCalendar($token, $calendarEventService)
    {
        $entity = $this->doctrine->getRepository("Twake\Calendar:ExportToken")->findOneBy(Array("user_token" => $token));
        if ($entity) {
            $calendars = $entity->getCalendars();
            $mode = $calendars["mode"];
            $options = Array("mode" => $mode,
                "calendar_list" => isset($calendars["calendar_list"]) ? $calendars["calendar_list"] : "",
                "after_ts" => date("U", strtotime("-2 months")),
                "before_ts" => date("U", strtotime("+10 months")));
            $user_entity = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $entity->getUserId()));


            $events = $calendarEventService->get($options, $user_entity);

            if (is_array($events)) {
                $vCalendar = $this->generateIcs($events);

                return new Response(
                    $vCalendar, 200, array(
                        'Content-Type' => 'application/octet-stream',
                        'Content-Description' => 'File Transfer',

                        'Content-Disposition' => 'attachment; filename="cal.ics"',

                        'Expires' => '0',
                        'Cache-Control' => 'must-revalidate',
                        'Pragma' => 'public',
                    )
                );
            } else {
                return new Response("Errors : Events not found in data-base");
            }
        } else
            return new Response("Errors : Token not found in data-base");


    }

    public function generateIcs($events)
    {
        $time_zone = new \DateTimeZone("Etc/UTC");
        date_default_timezone_set("Etc/UTC");


        $vCalendar = new Component\Calendar('twakeapp.com');
        foreach ($events as $evt) {

            if (isset($evt["from"]) && $evt["from"]) {
                $dateStart = new \DateTime(date("c", (int)$evt["from"]), $time_zone);
            } else {
                continue;
            }
            if (isset($evt["to"]) && $evt["to"]) {
                //If allday we need to remove one day because we dont use the normal format
                $dateEnd = new \DateTime(date("c", (int)$evt["to"]), $time_zone);
            } else {
                continue;
            }

            $vEvent = new Component\Event();

            if ($evt["repetition_definition"]) {
                try {
                    $rrule = $evt["repetition_definition"]["rrule"];
                    $rrule = explode("nRRULE", $rrule)[1];

                    foreach (explode(";", $rrule) as $parameter) {
                        $data = explode("=", $parameter);
                        $properties["key"][] = $data[0];
                        $properties["value"][] = $data[1];
                    }

                    foreach ($properties as $p) {
                        foreach ($p as $key => $value) {
                            switch ($value) {
                                case ":FREQ" :
                                    $freq = $key;
                                    break;
                                case ":INTERVAL" :
                                    $interval = $key;
                                    break;
                                case "UNTIL" :
                                    $until = $key;
                                    break;
                                case "COUNT" :
                                    $count = $key;
                                    break;
                                Default:
                            }

                        }
                    }
                    $freq = $properties["value"][$freq];
                    $interval = $properties["value"][$interval];
                    $until = $properties["value"][$until];
                    if ($count)
                        $count = $properties["value"][$count];
                    $stdRecurrenceRule = new \Eluceo\iCal\Property\Event\RecurrenceRule();

                    switch ($freq) {
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
                        Default:
                    }


                    $stdRecurrenceRule->setFreq(\Eluceo\iCal\Property\Event\RecurrenceRule::FREQ_WEEKLY);
                    $stdRecurrenceRule->setUntil(\DateTime::createFromFormat("Ymd\THis\Z", $until));
                    $stdRecurrenceRule->setInterval($interval);

                    switch ($properties["key"][3]) {
                        case "BYDAY" :
                            $stdRecurrenceRule->setByDay($properties["value"][3]);
                            break;
                        case "BYMONTH" :
                            $stdRecurrenceRule->setByMonth($properties["value"][3]);
                            break;
                        case "BYYEARDAY" :
                            $stdRecurrenceRule->setByYearDay($properties["value"][3]);
                            break;
                        case "BYWEEKNO" :
                            $stdRecurrenceRule->setByWeekNo($properties["value"][3]);
                            break;
                        case "BYMONTHDAY" :
                            $stdRecurrenceRule->setByMonthDay($properties["value"][3]);
                            break;
                        case "BYHOUR" :
                            $stdRecurrenceRule->setByHour($properties["value"][3]);
                            break;
                        case "BYMINUTE" :
                            $stdRecurrenceRule->setByMinute($properties["value"][3]);
                            break;
                        case "BYSECOND" :
                            $stdRecurrenceRule->setBySecond($properties["value"][3]);
                            break;
                        default:
                    }

                    $vEvent->setRecurrenceRule($stdRecurrenceRule);
                    $vEvent->setDuration(isset($evt["repetition_definition"]["duration"]) ? $evt["repetition_definition"]["duration"] : 0);

                } catch (\Exception $e) {
                    //No recurence !
                }
            }

            $vEvent
                ->setNoTime(isset($evt["all_day"]) ? $evt["all_day"] : false)
                ->setUseUtc(true)
                ->setDtStart($dateStart)
                ->setDtEnd($dateEnd)
                ->setSummary(isset($evt["title"]) ? $evt["title"] : "")
                ->setDescription(isset($evt["description"]) ? $evt["description"] : "")
                ->setLocation(isset($evt["location"]) ? $evt["location"] : "");

            if (isset($evt["id"])) {
                $vEvent->setUniqueId($evt["id"] . "");
            }

            $vCalendar->addComponent($vEvent);

        }

        return $vCalendar->render();
    }


}
