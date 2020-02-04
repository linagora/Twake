<?php
/**
 * Created by PhpStorm.
 * User: Elliot
 * Date: 11/04/2018
 * Time: 13:36
 */

namespace WebsiteApi\WorkspacesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class GroupAppsController extends Controller
{
    /**
     * Récupère les applications d'un group
     */
    public function getAppsAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("group_id");

        $apps = $this->get("app.group_apps")->getApps($groupId);

        if (!is_array($apps)) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"] = $apps;
        }

        return new JsonResponse($response);
    }

    public function setWorkspaceDefaultAction(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("group_id");
        $appid = $request->request->get("app_id");
        $boolean = $request->request->getInt("state");

        $res = $this->get("app.group_apps")->setWorkspaceDefault($groupId, $appid, $boolean, $this->getUser()->getId());

        if (!$res) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }

    public function removeApplicationAction(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("group_id");
        $appid = $request->request->get("app_id");

        $res = $this->get("app.group_apps")->removeApplication($groupId, $appid, $this->getUser()->getId());

        if (!$res) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }

    public function forceApplicationAction(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("group_id");
        $appid = $request->request->get("app_id");

        $res = $this->get("app.workspaces_apps")->forceApplication($groupId, $appid, $this->getUser()->getId());

        if (!$res) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }

    /**
     * Inscrit l'utilisation d'une application pour un groupe + pour un user
     */
    public function useAppAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("groupId");
        $workspaceId = $request->request->get("workspaceId");
        $appid = $request->request->get("appid");

        $res = $this->get("app.group_apps")->useApp($groupId, $workspaceId, $this->getUser()->getId(), $appid);

        if (!$res) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"][] = "success";
        }

        return new JsonResponse($response);
    }

}
