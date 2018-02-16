<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 17/01/18
 * Time: 14:36
 */

namespace Administration\AuthenticationBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class UserConnectionController extends Controller
{

    public function findConnectionAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user != null)
        {
            $userId = $request->request->get("user_id","");
            $startdate = $request->request->get("startdate","");
            $enddate = $request->request->get("enddate","");
            $listConnection = $this->get('admin.TwakeDailyConnection')->findConnection($userId,$startdate,$enddate);

            $listHeure = Array();
            foreach($listConnection as $connection)
            {

                $listHeure["debut"] = $connection->getDateConnection()->getTimestamp();
                $listHeure["fin"] = $listHeure["debut"] + $connection->getDureeConnection();

                $data["data"][] = $listHeure;
            }
        }
        else
        {
            $data["errors"][] = "disconnected";
        }

        return new JsonResponse($data);
    }
}