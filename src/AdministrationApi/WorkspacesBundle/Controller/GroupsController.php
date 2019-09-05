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
//            $page = $request->request->get("page");
//            $limit = $request->request->get("limit");
//            $offset = $page * $limit;
//
//            $validate_struct = $validation->validateStructure(Array(), Array(), $limit, $offset);
//
//            if ($validate_struct) {
//                $groups = $this->get("administration.groups")->getAllGroups($limit,$offset);
//
//                $data["data"] = $groups;
//            } else {
//                $data["errors"][] = "invalid_request_structure";
//            }
            $scroll_id = $request->request->get("scroll_id");
            $repository = "TwakeWorkspacesBundle:Group";

            if(isset($scroll_id) && isset($repository)){
                $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
            }
            else{
                $globalresult = $this->get('administration.groups')->getAllGroup();
            }

            $data["data"] = $globalresult;

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
                $data["data"]["group"]["creation_data"] = $group->getOnCreationData();
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

            $scroll_id = $request->request->get("scroll_id");
            $repository = "TwakeWorkspacesBundle:Group";

            $search_string = $request->request->get("search");

            $data['data']['group'] = array();
            $data['data']['workspaces'] = array();

            if(isset($scroll_id) && isset($repository)){
                $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
            }
            else{
                $options = Array(
                    "name" => $search_string
                );
                $globalresult = $this->get('administration.groups')->getGroupbyName($options);
            }

            $group_service = $this->get("administration.groups");

            foreach ($globalresult['group'] as $group) {

                $id = $group[0]['id'];

                $workspaces = $group_service->getGroupWorkspaces($id);

                $data['data']['group'][] = $group[0];
                $data['data']['workspaces'] = array_merge($data['data']['workspaces'], $workspaces);
            }

            $data['data']['group']['scroll_id'] = $globalresult['scroll_id'];

            $group = $group_service->getOneGroup($search_string);

            if ($group) {
                $data['data']['group'][] = $group->getAsArray();
            }

            $repository = "TwakeWorkspacesBundle:Group";

            if(isset($scroll_id) && isset($repository)){
                $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
            }
            else{
                $options = Array(
                    "name" => $search_string
                );
                $globalresult = $this->get('administration.workspaces')->getWpbyName($options);
            }

            foreach ($globalresult['workspace'] as $workspace) {

                $data['data']['workspaces'][] = $workspace[0];

            }

            $data['data']['workspaces']['scroll_id'] = $globalresult['scroll_id'];

            $workspace_service = $this->get("administration.workspaces");

            $workspace = $workspace_service->getOneWorkspace($search_string);

            if ($workspace) {
                $data['data']['workspaces'][] = $workspace->getAsArray();
            }


        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

}