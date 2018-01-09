<?php

namespace Administration\AuthenticationBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class TwakeUserManagerController extends Controller
{

    public function listTwakeUsersAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user != null)
        {
            $pageNumber = $request->request->get("page","1");
            $nbUserPage = $request->request->get("per_page","25");
            $filter = $request->request->get("filters","");
            $totalNumber = 0;
            $listTwakeUser = $this->get('admin.TwakeUserManagement')->listTwakeUsers($pageNumber,$nbUserPage,$filter,$totalNumber);

            $listResponse = Array();
            foreach($listTwakeUser as $twakeUser)
            {
                $listResponse[] = $twakeUser->getAsArray();
            }
	        $data["data"]["total"] = $totalNumber;
            $data["data"]["users"] = $listResponse;
        }
        else
        {
            $data["errors"][] = "disconnected";
        }


        return new JSonResponse($data);
    }

    public function getInfoUserAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $twakeUserId = $request->request->get("id","");
            $twakeUser = $this->get('admin.TwakeUserManagement')->getInfoUser($twakeUserId);
            if($twakeUser != null)
            {
                $data["data"]["user"] = $twakeUser->getAsArray();
            }
            else
            {
                $data["errors"][] = "null";
            }
        }
       // else
        //{
         //   $data["errors"][] = "disconnected";
        //}
        return new JsonResponse($data);
    }
}