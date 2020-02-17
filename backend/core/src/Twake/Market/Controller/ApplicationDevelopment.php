<?php

namespace Twake\Market\Controller;

use DevelopersApi\Users\Entity\Token;
use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class ApplicationDevelopment extends BaseController
{

    public function create(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $workspace_id = $request->request->get("workspace_id");
        $name = $request->request->get("name");
        $simple_name = $request->request->get("simple_name");
        $app_group_name = $request->request->get("app_group_name", "");

        $app_exists = $this->get("app.applications")->findAppBySimpleName($simple_name, true);

        if ($app_exists) {

            $data["errors"][] = "simple_name_used";

        } else {

            $res = $this->get("app.applications")->createApp($workspace_id, $name, $simple_name, $app_group_name, $this->getUser()->getId());

            if (!$res) {
                $data["errors"][] = "error";
            } else {

                $this->get("administration.counter")->incrementCounter("total_apps", 1);

                $data["data"] = $res;
            }

        }

        return new Response($data);

    }

    public function getGroupDevelopedApps(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $workspace_id = $request->request->get("workspace_id");
        $res = $this->get("app.applications")->getGroupDevelopedApps($workspace_id, $this->getUser()->getId());

        if (!is_array($res)) {
            $data["errors"][] = "error";
        } else {
            $data["data"] = $res;
        }

        return new Response($data);

    }

    public function update(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $application = $request->request->get("application");

        $app_exists = $this->get("app.applications")->findAppBySimpleName($application["simple_name"], true);

        if ($app_exists && $app_exists["id"] != $application["id"]) {

            $data["errors"][] = "simple_name_used";

        } else {

            $res = $this->get("app.applications")->update($application, $this->getUser()->getId());

            if (!is_array($res)) {
                $data["errors"][] = "error";
            } else {
                $data["data"] = $res;
            }

        }

        return new Response($data);

    }

    public function remove(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $application_id = $request->request->get("application_id");

        $res = $this->get("app.applications")->remove($application_id, $this->getUser()->getId());

        if (!$res) {
            $data["errors"][] = "error";
        } else {

            $this->get("administration.counter")->incrementCounter("total_apps", -1);

            $data["data"] = Array("success" => true);
        }

        return new Response($data);

    }

}
