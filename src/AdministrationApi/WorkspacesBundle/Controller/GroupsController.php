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
                $groups = $this->get("administration.groups").getAllGroups($limit,$offset);

                $data["data"] = $groups;
            } else {
                $data["errors"][] = "invalid_request_structure";
            }

        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

    public function getOneGroupAction(Request $request, $id) {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $group = $this->get("administration.groups")->getOneGroup($id);

            if ($group) {

                //TODO Get group data (workspaces, members, applications, Drive size)

                $data["data"] = $group;
            } else {
                $data["errors"][] = "group_not_found";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

}