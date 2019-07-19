<?php


namespace AdministrationApi\WorkspacesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class WorkspacesController extends Controller
{

    public function getOneWorkspaceAction(Request $request) {
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

                $data["data"]["workspace"] = $workspace->getAsArray();
                $data["data"]["members"] = $members;
                $data["data"]["apps"] = $apps;

                //TODO Infos du workspace a recuperer : taille du Drive
            } else {
                $data["errors"][] = "workspace_not_found";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

}