<?php


namespace WebsiteApi\TasksBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ExportController extends Controller
{
    public function exportAction(Request $request)
    {
        $token = $request->query->get("token");
        if ($token) {
            return $this->get("app.tasks.export")->exportBoard($token, $this->get("app.tasks.task"));
        } else
            return new JsonResponse("Errors : Token not found");
    }


    public function generateTokenAction(Request $request)
    {
        $user = $this->getUser();
        return new JsonResponse(Array("token" => $this->get("app.tasks.export")->generateToken($request, $user)));
    }
}