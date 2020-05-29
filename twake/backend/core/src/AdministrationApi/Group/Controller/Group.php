<?php


namespace AdministrationApi\Group\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Group extends BaseController
{

    public function getAllGroup(Request $request)
    {

//        $data = Array(
//            "data" => Array(),
//            "errors" => Array()
//        );
//
//        $validation = $this->get("administration.validation");
//        $token = $request->request->get("token");
//        $validate_token = $validation->validateAuthentication($token);
//
//        if ($validate_token) {
//
//            $offset = $request->request->get("offset");
//            $limit = $request->request->get("limit");
//
//            $validate_struct = $validation->validateStructure(Array(), Array(), $limit, $offset);
//
//            if ($validate_struct) {
//                $users = $this->get("administration.users")->getAllUsers($limit, $offset);
//
//                $data["data"] = $users;
//            } else {
//                $data["errors"][] = "invalid_request_structure";
//            }
//        } else {
//            $data["errors"][] = "invalid_authentication_token";
//        }
//
//        return new Response($data);

        $scroll_id = $request->request->get("scroll_id");
//        $scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAAAezFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAB7UWeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAAAe2FnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtxZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
//      $repository = "Twake\Workspaces:Group";

        if (isset($scroll_id) && isset($repository)) {
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id, $repository);
        } else {

            $globalresult = $this->get('administration.group')->getAllGroups();
        }

        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new Response($data);
    }

    public function getAllWorkspace(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
//        $scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAAAezFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAB7UWeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAAAe2FnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtxZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
//      $repository = "Twake\Workspaces:Group";

        if (isset($scroll_id) && isset($repository)) {
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id, $repository);
        } else {

            $globalresult = $this->get('administration.group')->getAllWorkspace();
        }

        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new Response($data);

    }

    public function getGroupbyname(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
//        $scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAAAezFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAB7UWeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAAAe2FnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtxZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
//      $repository = "Twake\Workspaces:Group";

        if (isset($scroll_id) && isset($repository)) {
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id, $repository);
        } else {
            $options = Array(
                "name" => "test"
            );
            $globalresult = $this->get('administration.group')->getGroupbyName($options);
        }

        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new Response($data);

    }

    public function getWpbyname(Request $request)
    {


        $scroll_id = $request->request->get("scroll_id");
//        $scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAAAezFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAB7UWeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAAAe2FnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtxZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
//      $repository = "Twake\Workspaces:Group";

        if (isset($scroll_id) && isset($repository)) {
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id, $repository);
        } else {
            $options = Array(
                "name" => "test"
            );
            $globalresult = $this->get('administration.group')->getWpbyName($options);
        }

        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new Response($data);

    }

    public function getUserbyMail(Request $request)
    {


        $scroll_id = $request->request->get("scroll_id");
//        $scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAAAezFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAB7UWeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAAAe2FnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtxZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
//      $repository = "Twake\Workspaces:Group";

        if (isset($scroll_id) && isset($repository)) {
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id, $repository);
        } else {
            $options = Array(
                "mail" => "romar"
            );
            $globalresult = $this->get('administration.group')->getUserbyMail($options);
        }

        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new Response($data);

    }

    public function getOneGroup(Request $request)
    {

//        $data = Array(
//            "data" => Array(),
//            "errors" => Array()
//        );
//
//        $validation = $this->get("administration.validation");
//        $token = $request->request->get("token");
//        $validate_token = $validation->validateAuthentication($token);
//
//        if ($validate_token) {
//
//            $user_id = $request->request->get("id");
//
//            $user_service = $this->get("administration.users");
//
//            $user = $user_service->getOneUser($user_id);
//
//            if ($user) {
//
//                if ($user == "Error") {
//                    $data["errors"][] = "unknown_error";
//                } else {
//
//                    $devices = $user_service->getUserDevices($user);
//                    $mails = $user_service->getUserMails($user);
//                    $workspaces = $user_service->getUserWorkspaces($user);
//                    $groups = $user_service->getUserGroups($user);
//
//                    $data["data"]["user"] = $user->getAsArray();
//                    $data["data"]["user"]["creation_date"] = $user->getCreationDate();
//                    $data["data"]["user"]["last_login"] = $user->getLastLogin();
//                    $data["data"]["devices"] = $devices;
//                    $data["data"]["mails"] = $mails;
//                    $data["data"]["workspaces"] = $workspaces;
//                    $data["data"]["groups"] = $groups;
//                }
//            } else {
//                $data["errors"][] = "user_not_found";
//            }
//        } else {
//            $data["errors"][] = "invalid_authentication_token";
//        }
//
//        return new Response($data);
    }

    public function findGroup(Request $request)
    {

//        $data = array(
//            "data" => Array(),
//            "errors" => Array()
//        );
//
//        $validation = $this->get("administration.validation");
//        $token = $request->request->get("token");
//        $validate_token = $validation->validateAuthentication($token);
//
//        if ($validate_token) {
//            $search_string = $request->request->get("search");
//
//            $users_service = $this->get("administration.users");
//
//            $users = $users_service->findUserByUsername($search_string);
//
//            if (!$users) {
//                $users = $users_service->findUserByEmail($search_string);
//            }
//
//            if (!$users) {
//                $users = $users_service->findUserById($search_string);
//            }
//
//            if (!$users) {
//
//                $advanced_search = $this->get("app.users");
//
//                $search_words = explode(" ", $search_string);
//
//                $users = $advanced_search->search($search_words, Array("allow_email" => true));
//
//            }
//
//            if (count($users) == 0) {
//                $data['errors'][] = "user_not_found";
//            } else {
//                $data['data'] = $users;
//            }
//
//        } else {
//            $data["errors"][] = "invalid_authentication_token";
//        }
//
//        return new Response($data);
    }

}