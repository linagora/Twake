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
        $this->get("app.calendar.event")->remove($object, Array(), $user );
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
            $object = $this->get("app.calendar_events")->save($object, Array(), $user);
        } catch (\Exception $e) {
            $object = false;
        }
        if (!$object) {
            return new JsonResponse(Array("error" => "unknown error or malformed query."));
        }
        return new JsonResponse(Array("object" => $object));

    }
}