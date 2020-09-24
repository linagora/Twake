<?php

namespace Twake\Calendar\Services;

use Twake\Calendar\Entity\Calendar;
use App\App;

class CalendarCalendar
{

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->applications_api = $app->getServices()->get("app.applications_api");
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        return $this->hasAccess($data, $current_user);
    }

    public function hasAccess($data, $current_user = null)
    {
        //TODO
        return true;
    }

    public function get($options, $current_user)
    {
        $workspace_id = $options["workspace_id"];
        $calendars = $this->doctrine->getRepository("Twake\Calendar:Calendar")->findBy(Array("workspace_id" => $workspace_id));

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if (count($calendars) == 0) {
            $cal = $this->save(Array(
                "workspace_id" => $workspace_id,
                "title" => "General",
                "color" => "#33b679",
                "auto_participants" => Array()
            ), Array(), null);
            if ($cal) {
                return [$cal];
            }
        }

        $ret = [];
        foreach ($calendars as $calendar) {
            $ret[] = $calendar->getAsArray();
        }

        return $ret;
    }

    public function save($object, $options, $current_user)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $did_create = false;
        if (isset($object["id"])) {
            $calendar = $this->doctrine->getRepository("Twake\Calendar:Calendar")->findOneBy(Array("id" => $object["id"]));
            if (!$calendar) {
                return false;
            }
        } else {
            $did_create = true;
            $calendar = new Calendar($object["workspace_id"], "", "");
            $calendar->setFrontId($object["front_id"]);
        }

        $calendar->setTitle($object["title"]);
        $calendar->setColor($object["color"]);
        $calendar->setAutoParticipants($object["auto_participants"]);
        $this->doctrine->persist($calendar);
        $this->doctrine->flush();

        $this->updateConnectors($calendar, $object["connectors"], $current_user ? $current_user->getId() : null);

        //Notify connectors
        $workspace_id = $calendar->getWorkspaceId();
        $resources = $this->applications_api->getResources($workspace_id, "workspace_calendar", $workspace_id);
        $apps_ids = [];
        foreach ($resources as $resource) {
            if (in_array("calendar", $resource->getApplicationHooks())) {
                $apps_ids[] = $resource->getApplicationId();
            }
        }
        if (count($apps_ids) > 0) {
            foreach ($apps_ids as $app_id) {
                if ($app_id) {
                    $data = Array(
                        "calendar" => $calendar->getAsArray()
                    );
                    if ($did_create) {
                        $this->applications_api->notifyApp($app_id, "hook", "new_calendar", $data);
                    } else {
                        $this->applications_api->notifyApp($app_id, "hook", "edit_calendar", $data);
                    }
                }
            }
        }

        return $calendar->getAsArray();

    }

    private function updateConnectors($calendar_entity, $connectors_ids, $current_user_id = null)
    {

        if (!$connectors_ids) {
            $connectors_ids = [];
        }

        $current_connectors = $calendar_entity->getConnectors();
        $current_connectors = $current_connectors ? $current_connectors : [];

        $did_something = false;

        foreach ($connectors_ids as $connector_id) {
            if (!in_array($connector_id, $current_connectors)) {
                $this->applications_api->addResource($connector_id, $calendar_entity->getWorkspaceId(), "calendar", $calendar_entity->getId(), $current_user_id);
                $did_something = true;
            }
        }

        foreach ($current_connectors as $current_connector_id) {
            if (!in_array($current_connector_id, $connectors_ids)) {
                $this->applications_api->removeResource($connector_id, $calendar_entity->getWorkspaceId(), "calendar", $calendar_entity->getId(), $current_user_id);
                $did_something = true;
            }
        }

        if ($did_something) {
            $calendar_entity->setConnectors($connectors_ids);
            $this->doctrine->persist($calendar_entity);
            $this->doctrine->flush();
        }

    }

    public function remove($object, $options, $current_user = null)
    {
        $id = $object["id"];

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $calendar = $this->doctrine->getRepository("Twake\Calendar:Calendar")->findOneBy(Array("id" => $id));
        if (!$calendar) {
            return false;
        }

        $this->doctrine->remove($calendar);
        $this->doctrine->flush();

        $this->doctrine->getRepository("Twake\Calendar:EventCalendar")->removeBy(Array("workspace_id" => $calendar->getWorkspaceId(), "calendar_id" => $id));

        return $object;
    }
}