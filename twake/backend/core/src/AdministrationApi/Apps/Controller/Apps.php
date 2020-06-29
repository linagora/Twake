<?php


namespace AdministrationApi\Apps\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Apps extends BaseController
{

    public function getAllApps(Request $request)
    {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $offset = $request->request->get("offset");
            $limit = $request->request->get("limit");

            $validate_struct = $validation->validateStructure(Array(), Array(), $limit, $offset);

            if ($validate_struct) {
                $apps = $this->get("administration.apps")->getAllApps($limit, $offset);

                $data["data"] = $apps;
            } else {
                $data["errors"][] = "invalid_request_structure";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

    public function getOneApp(Request $request)
    {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $app_id = $request->request->get("id");

            $app_service = $this->get("administration.apps");

            $app = $app_service->getOneApp($app_id);

            if ($app) {
                $data["data"] = $app->getAsArray();
            } else {
                $data["errors"][] = "app_not_found";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

    public function toggleValidation(Request $request)
    {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $app_id = $request->request->get("id");

            $app_service = $this->get("administration.apps");

            $app = $app_service->toggleAppValidation($app_id);

            if ($app) {
                $data["data"] = "";
            } else {
                $data["errors"][] = "app_not_validated";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

}