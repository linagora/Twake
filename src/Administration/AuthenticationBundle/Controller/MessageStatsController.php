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
        public function countDailyMessageAction(Request $request){
            $data = Array(
                "data" => Array(),
                "errors" => Array()
            );

            $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
            if($user != null)
            {
                $idTwakeUser = $request->request->get("twakeUser","1");
                $nbDailyMessage = $this->get('admin.TwakeDailyMessage')->countDailyMessage($idTwakeUser);
                if($nbDailyMessage != null)
                {
                    $data["data"][] = $nbDailyMessage;
                }
                else
                {
                    $data["errors"][] ="crappyshit";
                }
            }
            else
            {
                $data["errors"][] = "disconnected";
            }


            return new JsonResponse($data);
        }

    public function countPublicMessageAction(Request $request){
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null)
        {
            $idTwakeUser = $request->request->get("twakeUser","1");
            $startdate = $request->request->get("startdate","2018-01-17");
            $enddate = $request->request->get("enddate","2018-01-17");

            $nbDailyPublicMessage = 0;
            $nbDailyPublicMessage = $this->get('admin.TwakeDailyMessage')->countPublicMessage($idTwakeUser,$startdate,$enddate);
            if($nbDailyPublicMessage != null)
            {
                $data["data"] = $nbDailyPublicMessage;
            }
            else
            {
                $data["errors"][] ="crappyshit ".$nbDailyPublicMessage;
            }
        }
        else
        {
            $data["errors"][] = "disconnected";
        }


        return new JsonResponse($data);
    }

    public function countPrivateMessageAction(Request $request){
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null)
        {
            $idTwakeUser = $request->request->get("twakeUser","1");
            $startdate = $request->request->get("date","2018-01-17");
            $enddate = $request->request->get("date","2018-01-17");
            $nbDailyPrivateMessage = $this->get('admin.TwakeDailyMessage')->countPrivateMessage($idTwakeUser,$startdate, $enddate);
            if($nbDailyPrivateMessage != null)
            {
                $data["data"][] = $nbDailyPrivateMessage;
            }
            else
            {
                $data["errors"][] ="crappyshit";
            }
        }
        else
        {
            $data["errors"][] = "disconnected";
        }


        return new JsonResponse($data);
    }
}