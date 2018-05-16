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

        $nb = $this->get("app.groups")->countUsersGroup($groupId);
        $users = $this->get("app.groups")->getUsersGroup($groupId,$limit, $offset);

        if(!$users){
            $response["errors"][] = "notallowed";
        }else {
            $list = Array();
            foreach ($users as $user) {
                $list[] = Array(
                    "user" => $user["user"]->getAsArray()
                );
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
}