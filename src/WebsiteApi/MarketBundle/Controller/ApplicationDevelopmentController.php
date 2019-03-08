<?php

namespace WebsiteApi\MarketBundle\Controller;

use DevelopersApi\UsersBundle\Entity\Token;
use phpDocumentor\Reflection\Types\Array_;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\MarketBundle\Entity\Application;

class ApplicationDevelopment extends Controller
{

    public function createAction(Request $request)
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
                $data["data"] = $res;
            }

        }

        return new JsonResponse($data);

    }

    public function getGroupDevelopedAppsAction(Request $request)
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

        return new JsonResponse($data);

    }

    public function updateAction(Request $request)
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

        return new JsonResponse($data);

    }

    public function removeAction(Request $request)
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
            $data["data"] = Array("success" => true);
        }

        return new JsonResponse($data);

    }

}
