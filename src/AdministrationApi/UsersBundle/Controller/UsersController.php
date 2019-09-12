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

            $repository = "TwakeUsersBundle:User";

            $scroll_id = $request->request->get("scroll_id");

            if (isset($scroll_id) && isset($repository)) {
                $result = $this->get('globalsearch.pagination')->getnextelement($scroll_id, $repository);

                $users = array("users" => array(), "scroll_id" => $result["scroll_id"]);

                $users_service = $this->get("administration.users");

                foreach ($result["result"] as $value) {
                    $entity = $users_service->getOneUser($value[0]["id_as_string_for_session_handler"]);
                    if ($entity) {
                        $user_tab = $entity->getAsArray();
                        $user_tab["mail"] = $users_service->getUserMails($entity)[0];
                        $user_tab["phone_number"] = $entity->getPhone();
                        $user_tab["creation_date"] = $entity->getCreationDate();

                        $users["users"][] = array($user_tab, $value[1][0]);
                    }
                }
            } else {
                $users = $this->get("administration.users")->getAllUsers();
            }

            $data["data"] = $users;

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

        return new JsonResponse($data);
    }

    public function findUserAction(Request $request) {

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

        return new JsonResponse($data);
    }

}