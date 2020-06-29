<?php
/**
 * Created by PhpStorm.
 * User: Elliot
 * Date: 23/04/2018
 * Time: 10:57
 */

namespace Twake\Workspaces\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class GroupManager extends BaseController
{
    /**
     * Récupère les managers d'un group
     */
    public function getManagers(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("groupId");

        $managers = $this->get("app.group_managers")->getManagers($groupId, $this->getUser()->getId());

        if (!is_array($managers)) {
            $response["errors"][] = "notallowed";
        } else {
            $list = Array();
            foreach ($managers as $manager) {
                $list[] = Array(
                    "user" => $manager["user"]->getAsArray(),
                    "level" => $manager["level"],
                );
            }

            $response["data"] = Array(
                "managers" => $list
            );
        }

        return new Response($response);
    }

    /**
     * toggle status d'un utilisateur (manager ou non)
     */
    public function toggleManager(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("groupId");
        $userId = $request->request->get("userId");
        $isManager = $request->request->get("isManager", null);
        $result = $this->get("app.group_managers")->toggleManager($groupId, $userId, $isManager, $this->getUser()->getId());


        if (!$result) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"] = "success";
        }

        return new Response($response);
    }


    /**
     * Ajoute un manager au groupe
     */
    public function addManagers(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("groupId");
        $username = $request->request->get("username");

        $username = str_replace(Array("@", " "), "", $username);

        $userRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $username));

        if (!$user) {
            $response["errors"][] = "usernotfound";
            return new Response($response);
        }

        $result = $this->get("app.group_managers")->addManager($groupId, $user->getId(), 1, false, $this->getUser()->getId());


        if (!$result) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"] = "success";
        }

        return new Response($response);
    }

    /**
     * Retire un managers d'un group
     */
    public function removeManagers(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("groupId");
        $userId = $request->request->get("userId");

        $result = $this->get("app.group_managers")->removeManager($groupId, $userId, $this->getUser()->getId());

        if (!$result) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"] = "success";
        }

        return new Response($response);
    }

    /**
     * edite le managers d'un group
     */
    public function editManagers(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("groupId");
        $userId = $request->request->get("userId");
        $level = $request->request->get("level");

        $result = $this->get("app.group_managers")->changeLevel($groupId, $userId, $level, $this->getUser()->getId());

        if (!$result) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"] = "success";
        }

        return new Response($response);
    }

}
