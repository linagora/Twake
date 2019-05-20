<?php


namespace WebsiteApi\CalendarBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ExportController extends Controller
{
    public function exportAction(Request $request){
        //$token = $request->request->get("token");
        $token = "23d17e55f50460fbc08b36360a2ffe6db4975dcaeb61c45852a18836ded1ae7e";
        if ($token){
            return $this->get("app.calendar.export")->exportCalendar($token);
        }
        else
            return new JsonResponse("Errors : Token not found");
    }


    public function generateTokenAction(Request $request){
        error_log("generateTokenAction");
        $user = $this->getUser();
        $this->get("app.calendar.export")->generateToken($request, $user);
        return new JsonResponse("generateTokenAction");
    }
}