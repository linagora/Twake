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
            $filter = $request->request->get("filters",null);
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

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null)
        {
            $twakeUserId = $request->request->get("id","");
            $twakeUser = $this->get('admin.TwakeUserManagement')->getInfoUser($twakeUserId);
            if($twakeUser != null)
            {
                $data["data"]["user"] = array_merge($twakeUser->getAsArray(), array("banned"=>$twakeUser->getBanned(),"isConnected"=>$twakeUser->isConnected(),"lastLogin"=>$twakeUser->getLastLogin()));

                foreach ($twakeUser->getWorkspaces() as $workspace)
                    $data["data"]["workspaces"][] = $workspace->getAsSimpleArray();
            }
            else
            {
                $data["errors"][] = "null";
            }
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function setBannedAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null)
        {
            $twakeUserId = $request->request->get("id","");
            $banned = $request->request->getBoolean("banned",false);
            $twakeUser = $this->get('admin.TwakeUserManagement')->setBannedTwakeUser($twakeUserId,$banned);
            if($twakeUser != null)
            {

                $data["data"]["id"] = $twakeUserId;
            }
            else
            {
                $data["errors"][] = "null";
            }
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function searchUserAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $lastName = $request->request->get("lastname","");
            $firstName = $request->request->get("firstname", "");
            $userName = $request->request->get("username","");
            $email = $request->request->get("email","");
            $pageNumber = $request->request->get("page","1");
            $nbUserPage = $request->request->get("per_page","25");
            $totalNumber = 0;

            $listUser = $this->get('admin.TwakeUserManagement')->searchUser($pageNumber,$nbUserPage,$lastName,$firstName,$userName,$email,$totalNumber);

            $listResponse = Array();
            foreach($listUser as $twakeUser)
            {
                $listResponse[] = $twakeUser->getAsArray();
            }
            $data["data"]["total"] = $totalNumber;
            $data["data"]["users"] = $listResponse;
        }
        //else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function getSizeUploadedByUserAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $idTwakeUser = $request->request->get("idTwakeUser","");

            $size = $this->get('admin.TwakeUserManagement')->getSizeUploadedByUser($idTwakeUser);
            $data["data"]["size"] = $size;
        }
        //else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }


}