<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:39
 */

namespace Administration\AuthenticationBundle\Controller;

namespace Administration\AuthenticationBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class ServerStatsController extends Controller
{

    public function getCpuUsageAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null) {
            $data["data"] = $this->get('admin.TwakeServerStats')->getCpuUsage();
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function getStorageSpaceAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null) {
            $data["data"] = $this->get('admin.TwakeServerStats')->getStorageSpace();
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function getRamUsageAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null) {
            $data["data"] = $this->get('admin.TwakeServerStats')->getRamUsage();
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }


    public function getAllCpuUsageAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null) {
            $startdate = $request->request->get("startdate", "2018-01-17");
            $enddate = $request->request->get("enddate", "2018-01-17");
            $data["data"] = $this->get('admin.TwakeServerStats')->getAllCpuUsage($startdate, $enddate);
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function getAllRamUsageAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null) {
            $startdate = $request->request->get("startdate", "2018-01-17");
            $enddate = $request->request->get("enddate", "2018-01-17");
            $data["data"] = $this->get('admin.TwakeServerStats')->getAllRamUsage($startdate, $enddate);
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function getAllErrorsAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $res = $this->get('admin.TwakeServerStats')->getAllErrors();
            foreach ($res as $r)
            {
                $data["data"][] = $r->getAsArray();
            }
        }
        //else
        {
            $data["errors"][] = "disconnected";
        }

        return new JsonResponse($data);
    }
}