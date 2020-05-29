<?php


namespace AdministrationApi\Users\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Users extends BaseController
{

    public function getAllUsers(Request $request)
    {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {

            $repository = "Twake\Users:User";

            $scroll_id = $request->request->get("scroll_id");

            $options = Array();

            if (isset($scroll_id) && isset($repository)) {
                $options["scroll_id"] = $scroll_id;
            }

            $users = $this->get("administration.users")->getAllUsers($options);

            $data["data"] = $users;

        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

    public function getOneUser(Request $request)
    {

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
                    $data["data"]["user"]["creation_date"] = $user->getCreationDate();
                    $data["data"]["user"]["last_login"] = $user->getLastLogin();
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

        return new Response($data);
    }

    public function findUser(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {
            $search_string = $request->request->get("search");

            $users_service = $this->get("administration.users");

            $users = $users_service->findUserById($search_string);

            if (count($users["users"]) == 0) {
                $options = Array(
                    "mail" => $search_string
                );
                $users = $this->get('administration.users')->getUserbyMail($options);
            }

            if (count($users["users"]) == 0) {

                $advanced_search = $this->get("app.users");

                $options = array(
                    "name" => $search_string
                );

                $users = $advanced_search->search($options);

            }

            $data['data'] = $users;
        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new Response($data);
    }

}