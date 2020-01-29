<?php

/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/06/2017
 * Time: 11:56
 */

namespace WebsiteApi\MarketBundle\Controller;

use DevelopersApi\UsersBundle\Entity\Token;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ApplicationApiController extends Controller
{

    public function getTokenAction(Request $request)
    {
        $user = $this->getUser();
        $app_id = $request->request->get("application_id", null);
        $workspace_id = $request->request->get("workspace_id", null);
        $group_id = $request->request->get("group_id", null);

        if ($user != null) {
            $data = array("token" => $this->get("app.applications_api")->generatedToken($app_id, $workspace_id, $group_id, $user->getId()));
        } else {
            $data = array("error" => "unknown_error");
        }

        return new JsonResponse($data);

    }

    public function eventAction(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $workspace_id = $request->request->get("workspace_id");
        $group_id = $request->request->get("group_id");
        $app_id = $request->request->get("app_id");
        $type = $request->request->get("type");
        $event = $request->request->get("event");
        $evt_data = $request->request->get("data");

        $workspace = $this->get("app.workspaces")->get($workspace_id, $this->getUser()->getId());
        if ($workspace && $workspace->getGroup()->getId() == $group_id) {
            $can = $this->get("app.applications_api")->hasCapability($app_id, $group_id);
            if ($can) {

                $evt_data["workspace"] = $workspace->getAsArray();
                $evt_data["group"] = $workspace->getGroup()->getAsArray();
                $evt_data["user"] = $this->getUser()->getAsArray();

                $res = $this->get("app.applications_api")->notifyApp($app_id, $type, $event, $evt_data);
                if ($res) {
                    return new JsonResponse($data);
                }

            }

        }

        $data["errors"][] = "error";
        return new JsonResponse($data);

    }

}
