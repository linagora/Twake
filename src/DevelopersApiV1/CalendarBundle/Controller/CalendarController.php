<?php


namespace DevelopersApiV1\CalendarBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CalendarController extends Controller
{
    public function removeEventAction (Request $request){
        $capabilities = ["calendar_event_remove"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
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

        return new JsonResponse(Array("result" => $object));
    }

    public function saveEventAction (Request $request){
        $capabilities = ["calendar_event_create"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $object = $request->request->get("object", null);
        $user = null;
        try {
            $object = $this->get("app.calendar.event")->save($object, Array(), $user);
        } catch (\Exception $e) {
            $object = false;
        }
        if (!$object) {
            return new JsonResponse(Array("error" => "unknown error or malformed query."));
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

        return new JsonResponse(Array("object" => $object));

    }

    public function getCalendarList(Request $request){
        $privileges = ["workspace_calendar"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }
        $objects = false;
        $user_id = $request->request->get("user_id", "");
        $workspace_id = $request->request->get("workspace_id", "");
        if ($workspace_id){
            if ($user_id) {
                $user_entity = $this->get("app.users")->getById($user_id, true);
            }
            if($user_entity) {
                $objects = $this->get("app.calendar.calendar")->get(Array("workspace_id" => $workspace_id), $user_entity);
            }
        }

        if ($objects === false) {
            return new JsonResponse(Array("error" => "payload_error"));
        }

        $res = [];
        foreach ($objects as $object) {
            $res[] = $object;
        }

        return new JsonResponse(Array("data" => $res));
    }
}