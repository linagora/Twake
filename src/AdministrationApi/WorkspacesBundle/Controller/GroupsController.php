<?php


namespace AdministrationApi\WorkspacesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GroupsController extends Controller
{

    public function getAllGroupsAction(Request $request) {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $page = $request->request->get("page");
            $limit = $request->request->get("limit");
            $offset = $page * $limit;

            $validate_struct = $validation->validateStructure(Array(), Array(), $limit, $offset);

            if ($validate_struct) {
                $groups = $this->get("administration.groups")->getAllGroups($limit,$offset);

                $data["data"] = $groups;
            } else {
                $data["errors"][] = "invalid_request_structure";
            }

        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

    public function getOneGroupAction(Request $request) {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $id = $request->request->get("id");

            $group_service = $this->get("administration.groups");

            $group = $group_service->getOneGroup($id);

            if ($group) {

                $workspaces = $group_service->getGroupWorkspaces($group);
                $members = $group_service->getGroupMembers($group);
                $apps = $group_service->getGroupApps($group);

                //TODO Get group Drive size

                $data["data"]["group"] = $group->getAsArray();
                $data["data"]["workspaces"] = $workspaces;
                $data["data"]["members"] = $members;
                $data["data"]["apps"] = $apps;

            } else {
                $data["errors"][] = "group_not_found";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

    public function findGroupsAction(Request $request) {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {

            $data['data']['group'] = array();
            $data['data']['workspaces'] = array();

            $search_string = $request->request->get("search");

            $group_service = $this->get("administration.groups");

            $group = $group_service->getOneGroup($search_string);

            if ($group) {
                $data['data']['group'] = $group;
            }

            $workspace_service = $this->get("administration.workspaces");

            $workspace = $workspace_service->getOneWorkspace($search_string);

            if ($workspace) {
                $data['data']['workspaces'] = $workspace;
            }


        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

}