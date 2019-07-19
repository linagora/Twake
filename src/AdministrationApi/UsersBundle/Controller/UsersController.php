<?php


namespace AdministrationApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UsersController extends Controller
{

    public function getAllUsersAction(Request $request) {

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

            $validate_struct = $validation->validateStructure(Array(), Array(), $limit, $page);

            if ($validate_struct) {
                $users = $this->get("administration.users")->getAllUsers($limit, $page);

                $data["data"] = $users;
            } else {
                $data["errors"][] = "invalid_request_structure";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

    public function getOneUserAction(Request $request) {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {

            $user_id = $request->request->get("id");

            $user_service = $this->get("administration.users");

            $user = $user_service->getOneUser($user_id);

            if ($user) {

                if ($user == "Error") {
                    $data["errors"][] = "unknown_error";
                } else {

                    $devices = $user_service->getUserDevices($user);
                    $mails = $user_service->getUserMails($user);
                    $workspaces = $user_service->getUserWorkspaces($user);
                    $groups = $user_service->getUserGroups($user);

                    $data["data"]["user"] = $user->getAsArray();
                    $data["data"]["devices"] = $devices;
                    $data["data"]["mails"] = $mails;
                    $data["data"]["workspaces"] = $workspaces;
                    $data["data"]["groups"] = $groups;
                }
            } else {
                $data["errors"][] = "user_not_found";
            }
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

}