<?php

/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/06/2017
 * Time: 11:56
 */

namespace Twake\Market\Controller;

use DevelopersApi\Users\Entity\Token;
use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class ApplicationApi extends BaseController
{

    public function getToken(Request $request)
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

        return new Response($data);

    }

    public function event(Request $request)
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
        if ($workspace && $workspace->getGroup() == $group_id) {
            $can = $this->get("app.applications_api")->hasCapability($app_id, $group_id);
            if ($can) {

                $evt_data["workspace"] = $workspace->getAsArray($this->get("app.twake_doctrine"));
                $evt_data["group"] = $evt_data["workspace"]["group"];
                $evt_data["user"] = $this->getUser()->getAsArray();
                $evt_data["user"]["email"] = $this->getUser()->getEmail();

                $res = $this->get("app.applications_api")->notifyApp($app_id, $type, $event, $evt_data);
                if ($res) {
                    return new Response($data);
                }

            }

        }

        $data["errors"][] = "error";
        return new Response($data);

    }

}
