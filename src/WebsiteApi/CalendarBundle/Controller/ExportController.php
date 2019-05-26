<?php


namespace WebsiteApi\CalendarBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ExportController extends Controller
{
    public function exportAction(Request $request){
        $token = $request->query->get("token");
        if ($token){
            return $this->get("app.calendar.export")->exportCalendar($token, $this->get("app.calendar.event"));
        }
        else
            return new JsonResponse("Errors : Token not found");
    }


    public function generateTokenAction(Request $request){
        $user = $this->getUser();
        return new JsonResponse(Array("token" => $this->get("app.calendar.export")->generateToken($request, $user)));
    }
}