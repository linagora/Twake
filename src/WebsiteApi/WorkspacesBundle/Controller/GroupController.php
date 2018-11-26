<?php
/**
 * Created by PhpStorm.
 * User: yoanf
 * Date: 24/04/2018
 * Time: 16:54
 */

namespace WebsiteApi\WorkspacesBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GroupController extends Controller
{

    public function changeNameAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $name = $request->request->get("name");

        $res = $this->get("app.groups")->changeData($groupId,$name,$this->getUser()->getId());

        if(!$res){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }

    public function getUsersAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $limit = $request->request->get("limit");
        $offset = $request->request->get("offset");
        $onlyExterne = $request->request->getBoolean("onlyExterne");

        $nb = $this->get("app.groups")->countUsersGroup($groupId);
        $users = $this->get("app.groups")->getUsersGroup($groupId,$onlyExterne,$limit, $offset,$this->getUser()->getId());

        if (!is_array($users)) {
            $response["errors"][] = "notallowed";
        }else {
            $list = Array();
            foreach ($users as $user) {
                $temp = $user["user"]->getAsArray();
                $temp["externe"] = $user["externe"];
                $temp["level"] = $user["level"];
                $temp["nbWorkspace"] = $user["nbWorkspace"];
                $list[] = $temp;
            }
            $response["data"] = Array("users" => $list);
            $response["data"]["nbuser"] = $nb;
        }

        return new JsonResponse($response);
    }

    public function removeUserAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $userId = $request->request->get("userId");

        $users = $this->get("app.groups")->removeUserFromGroup($groupId,$userId,$this->getUser()->getId());

        if(!$users){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"][] = "success";
        }

        return new JsonResponse($response);
    }

    public function editUserAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $userId = $request->request->get("userId");
        $externe = $request->request->getBoolean("editExterne");

        $users = $this->get("app.groups")->editUserFromGroup($groupId,$userId,$externe,$this->getUser()->getId());

        if(!$users){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"][] = "success";
        }

        return new JsonResponse($response);
    }

    public function getWorkspacesAction(Request $request){
        $response = Array(
            "errors"=>Array(),
            "data"=>Array()
        );

        $groupId = $request->request->getInt("groupId");

        $workspaces =  $this->get("app.groups")->getWorkspaces($groupId, $this->getUser()->getId());

        foreach ($workspaces as $workspace){
            $is_deleted = $workspace->getis_deleted();

            if (!$is_deleted) {
                $response["data"][] = Array(
                    "workspace" => $workspace->getAsArray()
                );
            }
        }

        if (count($workspaces)==0){
            $response["errors"][] = "empty list";
        }


        return new JsonResponse($response);
    }

    public function runFreeOfferAction(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $groupId = $request->request->getInt("groupId");

        $res = $this->get("app.groups")->runFreeOffer($groupId, $this->getUser()->getId());

        if ($res) {
            $response["data"] = "success";
        } else {
            $response["errors"] = ["error"];
        }


        return new JsonResponse($response);
    }
}