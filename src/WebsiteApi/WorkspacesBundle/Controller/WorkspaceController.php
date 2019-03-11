<?php
/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace WebsiteApi\WorkspacesBundle\Controller;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class WorkspaceController extends Controller
{
	/**
     * Récupère les informations de base d'un workspace
	 */
	public function getAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->get("workspaceId");


		$ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());
		if(!$ws){
			$response["errors"][] = "notallowed";
		}else{

            if ($ws->getGroup() != null) {
                $this->get("app.groups")->stopFreeOffer($ws->getGroup()->getId());
            }

			$response["data"] = $ws->getAsArray();

            $workspaceApps = $this->get("app.workspaces_apps")->getApps($workspaceId);
			$apps = Array();
            foreach ($workspaceApps as $app_obj) {
				$apps[] = $app_obj->getAsArray();
			}
            $response["data"]["apps"] = $apps;
            $response["data"]["currentUser"] = $this->getUser()->getAsArray();
            $level = $this->get("app.workspace_levels")->getLevel($workspaceId, $this->getUser()->getId());
            $level = $this->get("app.workspace_levels")->fixLevels(Array($level),$workspaceApps)["levels"][0];

            $response["data"]["currentUser"]["level"] = $level;

            $levels = $this->get("app.workspace_levels")->getLevels($workspaceId,$this->getUser()->getId());
            $response["data"]["levels"] = Array();
            foreach ($levels as $level){
                $response["data"]["levels"][] = $level->getAsArray();
            }

            $groupRepository = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Group");
            $workspaceRepository = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace");
            $groupUserRepository = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:GroupUser");

            $wp = $workspaceRepository->find($workspaceId);
            if($wp->getGroup() != null){

                $group = $groupRepository->find($wp->getGroup()->getId());

                $level = $this->get("app.group_managers")->getLevel($group,$this->getUser()->getId());

                $privileges = $this->get("app.group_managers")->getPrivileges($level);
                $response["data"]["group"]["level"] = $privileges;

                $limit =  $this->get("app.pricing_plan")->getLimitation($group->getId(),"maxWorkspace",PHP_INT_MAX);

                $nbWorkspace = [];
                $_nbWorkspace = $workspaceRepository->findBy(Array("group" => $group));
                foreach ($_nbWorkspace as $ws) {
                    if (!$ws->getis_deleted()) {
                        $nbWorkspace[] = $ws;
                    }
                }

                $nbuserGroup = $groupUserRepository->findBy(Array("group"=>$wp->getGroup()));
                $limitUser = $this->get("app.pricing_plan")->getLimitation($wp->getGroup()->getId(), "maxUser", PHP_INT_MAX);
                $limitApps = $this->get("app.pricing_plan")->getLimitation($wp->getGroup()->getId(), "apps", PHP_INT_MAX);

                $response["data"]["maxWorkspace"] = $limit;
                $response["data"]["currentNbWorkspace"] = count($nbWorkspace);
                $response["data"]["maxUser"] = $limitUser;
                $response["data"]["maxApps"] = $limitApps;
                $response["data"]["currentNbUser"] = count($nbuserGroup);
            }

		}

		return new JsonResponse($response);
	}
	/**
	 * Récupère les informations de base d'un groupe
	 */
	public function createAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

        $name = $request->request->get("name", "");

        if (strlen($name) == 0) {
            $name = "Untitled";
        }

        $groupId = $request->request->get("groupId", 0);

		if(!$groupId){
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
		}

		$ws = $this->get("app.workspaces")->create($name, $groupId, $this->getUser()->getId());

		if(!$ws || is_string($ws)){
                $response["errors"][] = "notallowed";
                $response["errors"]["max"] = $ws;
		}else{
            $ws_id = $ws->getId();
			$response["data"]["status"] = "success";
            //$response["data"]["workspace_id"] = $ws_id;
            $response["data"]["workspace"] = $ws->getAsArray();
		}

		return new JsonResponse($response);
	}

    /**
     * Récupère les informations de base d'un groupe
     */
    public function duplicateAction(Request $request)
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

        return new JsonResponse($response);
    }

	public function deleteAction(Request $request)
	{
		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
            $workspaceId = $request->request->get("workspaceId");
			$ok = $this->get("app.workspaces")->remove(0, $workspaceId);
			if($ok){
				$data["data"] = "success";
			}
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);
	}

    /**
     * Récupère les applications d'un workspace
     */
    public function getAppsAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->get("workspace_id");

        $ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());
        if(!$ws){
            $response["errors"][] = "notallowed";
        }else{
            $apps = $this->get("app.workspaces_apps")->getApps($workspaceId);
            $response["data"] = $apps;
        }

        return new JsonResponse($response);
    }

    /**
     * desactive une application d'un workspace
     */
    public function disableAppAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->get("workspace_id");
        $appid = $request->request->get("app_id");

        $res = $this->get("app.workspaces_apps")->disableApp($workspaceId, $appid);
        if(!$res){
            $response["errors"][] = "notauthorized";
        }else{
            $response["data"][] = "success";
        }

        return new JsonResponse($response);
    }

    /**
     * Active une application d'un workspace
     */
    public function enableAppAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->get("workspace_id");
        $appid = $request->request->get("app_id");

        $res = $this->get("app.workspaces_apps")->enableApp($workspaceId, $appid);
        if(!$res){
            $response["errors"][] = "notauthorized";
        }else{
            $response["data"][] = "success";
        }

        return new JsonResponse($response);
    }

    public function getWorkspaceByNameAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $name = $request->request->get("name");

        $res = $this->get("app.workspaces")->getWorkspaceByName($name);
        if(!$res){
            $response["errors"][] = "notallowed";
        }else{
            $response["data"]["workspace"] = $res;
        }


        return new JsonResponse($response);
    }

    /**
     * Archiver archiver un workspace
     */
    public function archiveWorkspaceAction(Request $request){
        $response = Array(
            "errors"=>Array(),
            "data"=>Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $groupId = $request->request->get("groupId");

        $res = $this->get("app.workspaces")->archive($groupId, $workspaceId, $this->getUser()->getId());

        if ($res == true){
            $response["data"] = "success";
        }else{
            $response["errors"] = "impossible to archive";
        }

        return new JsonResponse($response);
    }

    /**
     * Désarchiver archiver un workspace
     */
    public function unarchiveWorkspaceAction(Request $request){
        $response = Array(
            "errors"=>Array(),
            "data"=>Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $groupId = $request->request->get("groupId");

        $res = $this->get("app.workspaces")->unarchive($groupId, $workspaceId, $this->getUser()->getId());

        if ($res == true){
            $response["data"] = "success";
        }else{
            $response["errors"] = "impossible to archive";
        }

        return new JsonResponse($response);
    }

    /**
     * Cacher ou non un workspace
     */
    public function hideOrUnhideWorkspaceAction(Request $request){
        $response = Array(
            "errors"=>Array(),
            "data"=>Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $wantedValue = $request->request->get("wantedValue");

        $res = $this->get("app.workspaces")->hideOrUnhideWorkspace($workspaceId, $this->getUser()->getId(), $wantedValue);

        if ($res == true){
            $response["data"] = "success";
        }else{
            $response["errors"] = "impossible to hide a workspace";
        }

        return new JsonResponse($response);
    }

    /**
     * Mettre un workspace en favori
     */
    public function favoriteOrUnfavoriteWorkspaceAction(Request $request){
        $response = Array(
            "errors"=>Array(),
            "data"=>Array()
        );

        $workspaceId = $request->request->get("workspaceId");

        $res = $this->get("app.workspaces")->favoriteOrUnfavoriteWorkspace($workspaceId, $this->getUser()->getId());

        if ($res["answer"]){
            $response["data"] = $res["isfavorite"];
        }else{
            $response["errors"] = "impossible to put as favorite a workspace";
        }

        return new JsonResponse($response);
    }

    /**
     * Recevoir ou non les notifications d'un workspace
     */
    public function haveNotificationsOrNotWorkspaceAction(Request $request){
        $response = Array(
            "errors"=>Array(),
            "data"=>Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $wantedValue = $request->request->get("wantedValue");

        $res = $this->get("app.workspaces")->haveNotificationsOrNotWorkspace($workspaceId, $this->getUser()->getId(), $wantedValue);

        if ($res == true){
            $response["data"] = "success";
        }else{
            $response["errors"] = "impossible to receive notifications";
        }

        return new JsonResponse($response);
    }


    public function setIsNewAction(Request $request){
        $response = Array(
            "errors"=>Array(),
            "data"=>Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $value = $request->request->get("value");

        $res = $this->get("app.workspaces")->setIsNew($value,$workspaceId,$this->getUser()->getId());
        if($res){
            $response["data"] = "success";
        }else{
            $response["data"] = "Set has not been done";
        }
        return new JsonResponse($response);
    }
}
