<?php
/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace Twake\Workspaces\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class Workspace extends BaseController
{
    /**
     * Récupère les informations de base d'un workspace
     */
    public function getAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");

        $this->get("app.channels.notifications")->checkReadWorkspace($workspaceId, $this->getUser());

        $ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());
        if (!$ws) {
            $response["errors"][] = "notallowed";
        } else {

            $response["data"] = $ws->getAsArray();

            $level = $this->get("app.workspace_levels")->getLevel($workspaceId, $this->getUser()->getId());
            $response["data"]["user_level"] = $level ? $level->getAsArray() : null;

            $levels = $this->get("app.workspace_levels")->getLevels($workspaceId, $this->getUser()->getId());
            $response["data"]["levels"] = Array();
            foreach ($levels as $level) {
                $response["data"]["levels"][] = $level->getAsArray();
            }

            $groupRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:Group");
            $workspaceRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:Workspace");
            $groupUserRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:GroupUser");

            $wp = $workspaceRepository->find($workspaceId);
            if ($wp->getGroup() != null) {
                $group = $groupRepository->find($wp->getGroup()->getId());

                $level = $this->get("app.group_managers")->getLevel($group, $this->getUser()->getId());

                $privileges = $this->get("app.group_managers")->getPrivileges($level);
                $response["data"]["group"]["level"] = $privileges;

                $response["data"]["apps"] = $this->get("app.workspaces_apps")->getApps($workspaceId);
                
                $this->get("app.workspace_members")->updateCountersIfEmpty($workspaceId);
                if($wp->getMemberCount() < 50){
                    $response["data"]["members"] = $this->get("app.workspace_members")->getMembersAndPending($workspaceId, $this->getUser()->getId());
                }else{
                    $response["data"]["members"] = [];
                }

                $response["data"]["maxWorkspace"] = $limit;
            }
        }
        return new Response($response);
    }

    public function getPublicData(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspace_id");

        $ws = $this->get("app.workspaces")->get($workspaceId);
        if (!$ws) {
            $response["errors"][] = "no_such_workspace";
        } else {

            $response["data"]["workspace_name"] = $ws->getName();

            if ($ws->getGroup() != null) {

                $group = $ws->getGroup();

                $response["data"]["group_name"] = $group->getAsArray()["name"];
                $response["data"]["group_logo"] = $group->getAsArray()["logo"];

            }
        }
        return new Response($response);

    }

    /**
     * Récupère les informations de base d'un groupe
     */
    public function create(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $name = $request->request->get("name", "");

        if (strlen($name) == 0) {
            $name = "Untitled";
        }

        $groupId = $request->request->get("groupId", 0);

        if (!$groupId) {
            $group_name = $request->request->get("group_name", "");
            $group_creation_data = $request->request->get("group_creation_data", "");

            if (!is_array($group_creation_data)) {
                $group_creation_data = Array();
            }

            //Auto create group
            if (!$group_name) {
                $group_name = $name;
            }

            $uniquename = $this->get("app.string_cleaner")->simplify($group_name);

            $plan = $this->get("app.pricing_plan")->getMinimalPricing();
            $planId = $plan->getId();
            $group = $this->get("app.groups")->create($this->getUser()->getId(), $group_name, $uniquename, $planId, $group_creation_data);
            $groupId = $group->getId();

            $this->get("administration.counter")->incrementCounter("total_groups", 1);

        }

        $ws = $this->get("app.workspaces")->create($name, $groupId, $this->getUser()->getId());

        if (!$ws || is_string($ws)) {
            $response["errors"][] = "notallowed";
            $response["errors"]["max"] = $ws;
        } else {

            $ws_id = $ws->getId();

            $channels = $request->request->get("channels", false);
            if ($channels && is_array($channels)) {
                foreach ($channels as $channel) {
                    $this->get("app.channels.channels_system")->save(Array(
                        "original_workspace" => $ws_id,
                        "original_group" => $ws->getGroup()->getId(),
                        "name" => $channel["name"],
                        "icon" => $channel["icon"]
                    ), Array("workspace_id" => $ws_id), $this->getUser());
                }
            }

            $response["data"]["status"] = "success";
            //$response["data"]["workspace_id"] = $ws_id;
            $response["data"]["workspace"] = $ws->getAsArray();

            $this->get("administration.counter")->incrementCounter("total_workspaces", 1);

        }

        return new Response($response);
    }

    /**
     * Récupère les informations de base d'un groupe
     */
    public function duplicate(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $original_workspace_id = $request->request->get("original_workspace_id", 0);
        $name = $request->request->get("config_name", "");

        $config = Array();

        $config["users"] = $request->request->get("config_users", "me");

        $config["calendars"] = $request->request->get("config_calendars", 1);
        $config["streams"] = $request->request->get("config_streams", 1);
        $config["drive_labels"] = $request->request->get("config_drive_labels", 1);
        $config["boards"] = $request->request->get("config_boards", 1);
        $config["rights"] = $request->request->get("config_rights", 1);

        $ws = $this->get("app.workspaces")->duplicate($original_workspace_id, $name, $config, $this->getUser()->getId());

        if (!$ws || is_string($ws)) {
            $response["errors"][] = "notallowed";
            $response["errors"]["max"] = $ws;
        } else {
            $ws_id = $ws->getId();
            $response["data"]["status"] = "success";
            $response["data"]["workspace_id"] = $ws_id;
        }

        return new Response($response);
    }

    public function delete(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {
            $workspaceId = $request->request->get("workspaceId");
            $ok = $this->get("app.workspaces")->remove(0, $workspaceId);
            if ($ok) {
                $data["data"] = "success";
            }
        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);
    }

    /**
     * Récupère les applications d'un workspace
     */
    public function getApps(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspace_id");

        $ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());
        if (!$ws) {
            $response["errors"][] = "notallowed";
        } else {
            $apps = $this->get("app.workspaces_apps")->getApps($workspaceId);
            $response["data"] = $apps;
        }

        return new Response($response);
    }

    /**
     * desactive une application d'un workspace
     */
    public function disableApp(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspace_id");
        $appid = $request->request->get("app_id");

        $res = $this->get("app.workspaces_apps")->disableApp($workspaceId, $appid);
        if (!$res) {
            $response["errors"][] = "notauthorized";
        } else {
            $response["data"][] = "success";
        }

        return new Response($response);
    }

    /**
     * Active une application d'un workspace
     */
    public function enableApp(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspace_id");
        $appid = $request->request->get("app_id");

        $res = $this->get("app.workspaces_apps")->enableApp($workspaceId, $appid);
        if (!$res) {
            $response["errors"][] = "notauthorized";
        } else {
            $response["data"][] = "success";
        }

        return new Response($response);
    }

    public function getWorkspaceByName(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $name = $request->request->get("name");

        $res = $this->get("app.workspaces")->getWorkspaceByName($name);
        if (!$res) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"]["workspace"] = $res;
        }


        return new Response($response);
    }

    /**
     * Archiver archiver un workspace
     */
    public function archiveWorkspace(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $groupId = $request->request->get("groupId");

        $res = $this->get("app.workspaces")->archive($groupId, $workspaceId, $this->getUser()->getId());

        if ($res == true) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "impossible to archive";
        }

        return new Response($response);
    }

    /**
     * Désarchiver archiver un workspace
     */
    public function unarchiveWorkspace(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $groupId = $request->request->get("groupId");

        $res = $this->get("app.workspaces")->unarchive($groupId, $workspaceId, $this->getUser()->getId());

        if ($res == true) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "impossible to archive";
        }

        return new Response($response);
    }

    /**
     * Cacher ou non un workspace
     */
    public function hideOrUnhideWorkspace(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $wantedValue = $request->request->get("wantedValue");

        $res = $this->get("app.workspaces")->hideOrUnhideWorkspace($workspaceId, $this->getUser()->getId(), $wantedValue);

        if ($res == true) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "impossible to hide a workspace";
        }

        return new Response($response);
    }

    /**
     * Mettre un workspace en favori
     */
    public function favoriteOrUnfavoriteWorkspace(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");

        $res = $this->get("app.workspaces")->favoriteOrUnfavoriteWorkspace($workspaceId, $this->getUser()->getId());

        if ($res["answer"]) {
            $response["data"] = $res["isfavorite"];
        } else {
            $response["errors"] = "impossible to put as favorite a workspace";
        }

        return new Response($response);
    }

    /**
     * Recevoir ou non les notifications d'un workspace
     */
    public function haveNotificationsOrNotWorkspace(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $wantedValue = $request->request->get("wantedValue");

        $res = $this->get("app.workspaces")->haveNotificationsOrNotWorkspace($workspaceId, $this->getUser()->getId(), $wantedValue);

        if ($res == true) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "impossible to receive notifications";
        }

        return new Response($response);
    }


    public function setIsNew(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $value = $request->request->get("value");

        $res = $this->get("app.workspaces")->setIsNew($value, $workspaceId, $this->getUser()->getId());
        if ($res) {
            $response["data"] = "success";
        } else {
            $response["data"] = "Set has not been done";
        }
        return new Response($response);
    }

    
}