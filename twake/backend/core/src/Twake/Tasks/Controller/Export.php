<?php


namespace Twake\Tasks\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Export extends BaseController
{
    public function export(Request $request)
    {
        $token = $request->query->get("token");
        if ($token) {
            return $this->get("app.tasks.export")->exportBoard($token, $this->get("app.tasks.task"));
        } else
            return new Response("Errors : Token not found");
    }


    public function generateToken(Request $request)
    {
        $user = $this->getUser();
        return new Response(Array("token" => $this->get("app.tasks.export")->generateToken($request, $user)));
    }
}