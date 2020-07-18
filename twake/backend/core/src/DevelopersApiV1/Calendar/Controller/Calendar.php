<?php


namespace DevelopersApiV1\Calendar\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Calendar extends BaseController
{
    public function removeEvent(Request $request)
    {
        $capabilities = ["calendar_event_remove"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $object = $request->request->get("object", null);
        $user = null;
        $object = $this->get("app.calendar.event")->remove($object, Array(), $user);

        $event = Array(
            "client_id" => "system",
            "action" => "remove",
            "object_type" => "",
            "front_id" => $object["front_id"]
        );
        $workspace_calendars = $object["workspaces_calendars"] ? $object["workspaces_calendars"] : [];
        $workspace_ids = [];
        foreach ($workspace_calendars as $wc) {
            if (!in_array($wc["workspace_id"], $workspace_ids)) {
                $workspace_ids[] = $wc["workspace_id"];
                $this->get("app.websockets")->push("calendar_events/" . $wc["workspace_id"], $event);
            }
        }

        $this->get("administration.counter")->incrementCounter("total_api_calendar_operation", 1);

        return new Response(Array("result" => $object));
    }

    public function saveEvent(Request $request)
    {
        $capabilities = ["calendar_event_save"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $object = $request->request->get("object", null);
        $user = null;
        try {
            $object = $this->get("app.calendar.event")->save($object, Array(), $user);
        } catch (\Exception $e) {
            $object = false;
        }
        if (!$object) {
            return new Response(Array("error" => "unknown error or malformed query."));
        }

        if ($object) {

            $event = Array(
                "client_id" => "system",
                "action" => "save",
                "object_type" => "",
                "object" => $object
            );
            $workspace_calendars = $object["workspaces_calendars"] ? $object["workspaces_calendars"] : [];
            $workspace_ids = [];
            foreach ($workspace_calendars as $wc) {
                if (!in_array($wc["workspace_id"], $workspace_ids)) {
                    $workspace_ids[] = $wc["workspace_id"];
                    $this->get("app.websockets")->push("calendar_events/" . $wc["workspace_id"], $event);
                }
            }

        }

        $this->get("administration.counter")->incrementCounter("total_api_calendar_operation", 1);

        return new Response(Array("object" => $object));

    }

    public function getCalendarList(Request $request)
    {
        $privileges = ["workspace_calendar"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }
        $objects = false;
        $user_id = $request->request->get("user_id", "");
        $workspace_id = $request->request->get("workspace_id", "");
        if ($workspace_id) {
            if ($user_id) {
                $user_entity = $this->get("app.users")->getById($user_id, true);
            }
            if ($user_entity) {
                $objects = $this->get("app.calendar.calendar")->get(Array("workspace_id" => $workspace_id), $user_entity);
            }
        }

        if ($objects === false) {
            return new Response(Array("error" => "payload_error"));
        }

        $res = [];
        foreach ($objects as $object) {
            $res[] = $object;
        }

        $this->get("administration.counter")->incrementCounter("total_api_calendar_operation", 1);

        return new Response(Array("data" => $res));
    }
}