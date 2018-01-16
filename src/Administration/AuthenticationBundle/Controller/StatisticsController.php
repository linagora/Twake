<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 16/01/18
 * Time: 14:42
 */

namespace Administration\AuthenticationBundle\Controller;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;
use Symfony\Component\Serializer\Encoder\JsonEncode;

class StatisticsController extends Controller
{

    public function numberOfUserCurrentlyConnectedAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $nbConnected = $this->get('admin.TwakeStatistics')->numberOfUserCurrentlyConnected();
            if($nbConnected != null)
            {
                $data["data"][] = $nbConnected->getAsArray();
            }
        }
        //else
        {
            $data["errors"][] = "disconnected";
        }


        return new JsonResponse($data);
    }

}