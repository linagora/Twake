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
            $date = $request->request->get("date","");
            $listConnection = $this->get('admin.TwakeDailyConnection')->findConnection($userId,$date);

            $listHeure = Array();
            $listDuree = Array();
            foreach($listConnection as $connection)
            {
                $listHeure["heure"] = $connection->getDateConnection()->getTimeStamp();
                $listHeure["duree"] = $connection->getDureeConnection();

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