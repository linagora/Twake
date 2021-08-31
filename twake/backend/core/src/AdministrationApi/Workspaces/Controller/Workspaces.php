<?php


namespace AdministrationApi\Workspaces\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Workspaces extends BaseController
{

    public function getOneWorkspace(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $id = $request->request->get("id");

            $workspace_service = $this->get("administration.workspaces");

            $workspace = $workspace_service->getOneWorkspace($id);

            if ($workspace) {
                $members = $workspace_service->getWorkspaceMembers($workspace);
                $apps = $workspace_service->getWorkspaceApps($workspace);
                $invited_mails = $workspace_service->getInvitedUsers($workspace);

                $data["data"]["workspace"] = $workspace->getAsArray($this->get("app.twake_doctrine"));
                $data["data"]["members"] = $members;
                $data["data"]["apps"] = $apps;
                $data["data"]["invited"] = $invited_mails;

                //TODO Infos du workspace a recuperer : taille du Drive
            } else {
                $data["errors"][] = "workspace_not_found";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

    public function getAllWorkspaces(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $scroll_id = $request->request->get("scroll_id");
            $repository = "Twake\Workspaces:Group";

            $options = Array();

            if (isset($scroll_id) && isset($repository)) {
                $options["scroll_id"] = $scroll_id;
            }

            $globalresult = $this->get('administration.workspaces')->getAllWorkspace($options);

            $data = Array("data" => $globalresult);
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

}