<?php


namespace AdministrationApi\Workspaces\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Groups extends BaseController
{

    public function getAllGroups(Request $request)
    {

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
            $repository = "Twake\Workspaces:Group";

            $options = Array();

            if (isset($scroll_id) && isset($repository)) {
                $options["scroll_id"] = $scroll_id;
            }

            $globalresult = $this->get('administration.groups')->getAllGroups($options);

            $data["data"] = $globalresult;

        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

    public function getOneGroup(Request $request)
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

        return new Response($data);
    }

    public function findGroups(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {

            $group_scroll_id = $request->request->get("group_scroll_id");

            $repository = "Twake\Workspaces:Group";

            $search_string = $request->request->get("search");

            $data['data']['group'] = array();
            $data['data']['workspaces'] = array();

            $options = Array(
                "name" => $search_string
            );

            if (isset($group_scroll_id) && isset($repository)) {
                $options["scroll_id"] = $group_scroll_id;
            }

            $globalresult = $this->get('administration.groups')->getGroupbyName($options);

            $group_service = $this->get("administration.groups");

            foreach ($globalresult['group'] as $group) {

                $id = $group[0]['id'];

                $workspaces = $group_service->getGroupWorkspaces($id);

                $data['data']['group'][] = $group[0];
                $data['data']['workspaces'] = array_merge($data['data']['workspaces'], $workspaces);
            }

            $data['data']['group_scroll_id'] = $globalresult['scroll_id'];

            $group = $group_service->getOneGroup($search_string);

            if ($group) {
                $data['data']['group'][] = $group->getAsArray();
            }

            $workspace_scroll_id = $request->request->get("workspace_scroll_id");

            $repository = "Twake\Workspaces:Group";

            if (isset($workspace_scroll_id) && isset($repository)) {
                $globalresult = $this->get('globalsearch.pagination')->getnextelement($workspace_scroll_id, $repository);
            } else {
                $options = Array(
                    "name" => $search_string
                );
                $globalresult = $this->get('administration.workspaces')->getWpbyName($options);
            }

            foreach ($globalresult['workspace'] as $workspace) {

                $data['data']['workspaces'][] = $workspace[0];

            }

            $data['data']['workspaces_scroll_id'] = $globalresult['scroll_id'];

            $workspace_service = $this->get("administration.workspaces");

            $workspace = $workspace_service->getOneWorkspace($search_string);

            if ($workspace) {
                $data['data']['workspaces'][] = $workspace->getAsArray($this->get("app.twake_doctrine"));
            }


        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

}