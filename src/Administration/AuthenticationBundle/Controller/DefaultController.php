<?php

namespace Administration\AuthenticationBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class DefaultController extends Controller
{
    public function authenticateAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $username = $request->request->get("username", "");
        $password = $request->request->get("password", "");

        $token = $this->get('admin.Authentication')->authenticate($username,$password);

        if($token == null)
        {
            $data["errors"][] = "disconnected";
        }
        else
        {
            $data["data"]["token"] =  $token;
        }

        return new JsonResponse($data);
    }

    public function currentUserAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user == null)
        {
            $data["errors"][] = "disconnected";
        }
        else
        {
            $data["data"]["user"] = $user->getUser()->getAsArray();
            $data["data"]["role"] = "";
        }

        return new JsonResponse($data);
    }
}
