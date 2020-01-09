<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class ContactsController extends Controller
{

    public function addAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $user_id = $request->request->get("user_id", 0);
            $res = $this->get("app.contacts")->ask($this->getUser(), $user_id);
            if ($res) {
                $data["data"] = "success";
            }
        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function removeAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $user_id = $request->request->get("user_id", 0);
            $res = $this->get("app.contacts")->remove($this->getUser(), $user_id);
            if ($res) {
                $data["data"] = "success";
            }
        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function getAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $user_id = $request->request->get("user_id", 0);
            $res = $this->get("app.contacts")->get($this->getUser(), $user_id);
            if ($res) {
                if ($res->getStatus()) {
                    $data["data"] = "friends";
                } else {
                    if ($res->getFrom()->getId() == $user_id) {
                        $data["data"] = "fromHim";
                    } else {
                        $data["data"] = "fromMe";
                    }
                }
            } else {
                $data["data"] = "none";
            }
        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function getAllAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $res = $this->get("app.contacts")->getAll($this->getUser());
            $list = [];
            foreach ($res as $user) {
                $list[] = $user->getAsArray();
            }
            $data["data"] = $list;
        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function getAllRequestsAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $res = $this->get("app.contacts")->getAllRequests($this->getUser());
            $list = [];
            foreach ($res as $user) {
                $list[] = $user->getAsArray();
            }
            $data["data"] = $list;
        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function getAllRequestsFromMeAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $res = $this->get("app.contacts")->getAllRequestsFromMe($this->getUser());
            $list = [];
            foreach ($res as $user) {
                $list[] = $user->getAsArray();
            }
            $data["data"] = $list;
        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function searchByUsernameAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $username = $request->request->get("username", "");
            $res = $this->get("app.contacts")->searchByUsername($username);
            if ($res) {
                $data["data"] = $res->getAsArray();
            }
        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function searchUsersByUsernameAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {
            $username = $request->request->get("username", "");
            $restrictions = $request->request->get("restriction", "all");
            $groupId = $request->request->get("groupId", "-1");
            $workspaceId = $request->request->get("workspaceId", "-1");
            $res = $this->get("app.contacts")->searchUsersByUsername($username, $restrictions, $groupId, $workspaceId);
            if (!$res) {
                $data["errors"][] = "error";
            } else {
                $array_user = [];
                foreach ($res as $user) {
                    $array_user[] = $user->getAsArray();
                }
                $data["data"] = $array_user;
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }


}