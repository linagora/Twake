<?php


namespace Twake\Calendar\Controller;

use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ExportController extends BaseController
{
    public function export(Request $request)
    {
        $token = $request->query->get("token");
        if ($token) {
            return $this->get("app.calendar.export")->exportCalendar($token, $this->get("app.calendar.event"));
        } else
            return new JsonResponse("Errors : Token not found");
    }


    public function generateToken(Request $request)
    {
        $user = $this->getUser();
        return new JsonResponse(Array("token" => $this->get("app.calendar.export")->generateToken($request, $user)));
    }
}