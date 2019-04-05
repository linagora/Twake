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


    public function getUploader()
    {
        $aws = $this->getParameter('aws');
        if (isset($aws["S3"]["use"]) && $aws["S3"]["use"]) {
            return $this->get("app.aws_uploader");
        }
        $openstack = $this->getParameter('openstack');
        if (isset($openstack["use"]) && $openstack["use"]) {
            return $this->get("app.openstack_uploader");
        }
        return $this->get("app.uploader");
    }

    public function changeNameAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->get("groupId");
        $name = $request->request->get("name");

        $res = $this->get("app.groups")->changeData($groupId,$name,$this->getUser()->getId());

        if(!$res){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }

    public function setLogoAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $groupId = $request->request->get("groupId");

        if (isset($_FILES["logo"])) {
            error_log("logo ");
            $thumbnail = $this->getUploader()->uploadFiles($this->getUser(), $_FILES["logo"], "grouplogo");
            $thumbnail = $thumbnail[0];

            if (count($thumbnail["errors"]) > 0) {
                error_log("error ".print_r($thumbnail));
                $data["errors"][] = "badimage";
            } else {

                $this->get("app.groups")->changeLogo($groupId, $thumbnail["file"], $this->getUser()->getId(), $this->getUploader());
            }
        } else {
            $this->get("app.groups")->changeLogo($groupId, null, $this->getUser()->getId(), $this->getUploader());
        }

        return new JsonResponse($data);

    }

    public function getUsersAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->get("groupId");
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
                $temp = Array();
                $temp["user"] = $user["user"]->getAsArray();
                $temp["externe"] = $user["externe"];
                $temp["groupLevel"] = $user["level"];
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

        $groupId = $request->request->get("groupId");
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

        $groupId = $request->request->get("groupId");
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

        $groupId = $request->request->get("groupId");

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

        $groupId = $request->request->get("groupId");

        $res = $this->get("app.groups")->runFreeOffer($groupId, $this->getUser()->getId());

        if ($res) {
            $response["data"] = "success";
        } else {
            $response["errors"] = ["error"];
        }


        return new JsonResponse($response);
    }
}