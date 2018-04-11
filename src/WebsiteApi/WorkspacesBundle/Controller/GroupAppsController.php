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
                $apps[] = $app_obj->getAsArray();
            }
            $response["data"]["apps"] = $apps;
        }

        return new JsonResponse($response);
    }

}
