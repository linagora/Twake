<?php


namespace Twake\Tasks\Controller;

use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ExportController extends BaseController
{
    public function export(Request $request)
    {
        $token = $request->query->get("token");
        if ($token) {
            return $this->get("app.tasks.export")->exportBoard($token, $this->get("app.tasks.task"));
        } else
            return new JsonResponse("Errors : Token not found");
    }


    public function generateToken(Request $request)
    {
        $user = $this->getUser();
        return new JsonResponse(Array("token" => $this->get("app.tasks.export")->generateToken($request, $user)));
    }
}