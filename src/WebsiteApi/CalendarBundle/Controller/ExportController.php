<?php


namespace WebsiteApi\CalendarBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ExportController extends Controller
{
    public function exportAction(Request $request){
        error_log("exportAction");
        return $this->get("app.calendar.export")->exportCalendar($request);
    }

    public function generateTokenAction(Request $request){
        error_log("generateTokenAction");
        $this->get("app.calendar.export")->generateToken($request);
        return new JsonResponse("generateTokenAction");
    }
}