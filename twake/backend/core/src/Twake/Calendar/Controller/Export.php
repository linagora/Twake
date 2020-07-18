<?php


namespace Twake\Calendar\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Export extends BaseController
{
    public function export(Request $request)
    {
        $token = $request->query->get("token");
        if ($token) {
            return $this->get("app.calendar.export")->exportCalendar($token, $this->get("app.calendar.event"));
        } else
            return new Response("Errors : Token not found");
    }


    public function generateToken(Request $request)
    {
        $user = $this->getUser();
        return new Response(Array("token" => $this->get("app.calendar.export")->generateToken($request, $user)));
    }
}