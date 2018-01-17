<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 17/01/18
 * Time: 11:12
 */

namespace Administration\AuthenticationBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class MessageStatsController extends Controller
{
        public function countDailyMessageAction($request){
            $data = Array(
                "data" => Array(),
                "errors" => Array()
            );

            $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
            if($user != null)
            {
                $idTwakeUser = $request->request->get("twakeUser","1");
                $nbDailyMessage = $this->get('admin.DailyMessageStatistics')->countDailyMessage($idTwakeUser);
                if($nbDailyMessage != null)
                {
                    $data["data"][] = $nbDailyMessage;
                }
            }
            else
            {
                $data["errors"][] = "disconnected";
            }


            return new JsonResponse($data);
        }
}