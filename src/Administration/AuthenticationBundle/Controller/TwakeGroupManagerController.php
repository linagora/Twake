<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 09/01/18
 * Time: 10:23
 */

namespace Administration\AuthenticationBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class TwakeGroupManagerController extends Controller
{
    public function listTwakeGroupsAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user != null)
        {
            //TODO
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }
}