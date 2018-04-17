<?php
/**
 * Created by PhpStorm.
 * User: Elliott
 * Date: 11/04/2018
 * Time: 13:36
 */

namespace WebsiteApi\WorkspacesBundle\Controller;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class GroupAppsController extends Controller
{
    /**
     * Récupère les applications d'un group
     */
    public function getAppsAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");

        $apps_obj = $this->get("app.group_apps")->getApps($groupId);

        if(!$apps_obj){
            $response["errors"][] = "notallowed";
        }else{
            //Apps
            $apps = Array();
            foreach ($apps_obj as $app_obj){
                $tmp = Array(
                    "app" => $app_obj->getApp()->getAsArray(),
                    "workspaceDefault" => $app_obj->getWorkspaceDefault());
                $apps[] = $tmp;
            }
            $response["data"]["apps"] = $apps;
        }

        return new JsonResponse($response);
    }

    public function setWorkspaceDefaultAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $appId = $request->request->getInt("appId");
        $boolean = $request->request->getInt("boolean");

        $apps_obj = $this->get("app.group_apps")->setWorkspaceDefault($groupId,$appId,$boolean,$this->getUser()->getId());

        if(!$apps_obj){
            $response["errors"][] = "notallowed";
        }else{
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }

    public function RemoveApplicationAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $appId = $request->request->getInt("appId");

        $apps_obj = $this->get("app.group_apps")->RemoveApplication($groupId,$appId,$this->getUser()->getId());

        if(!$apps_obj){
            $response["errors"][] = "notallowed";
        }else{
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }

}
