<?php
/**
 * Created by PhpStorm.
 * User: Syma
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
	 * Récupère les informations de base d'un groupe
	 */
	public function getAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");


		$ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());
		if(!$ws){
			$response["errors"][] = "notallowed";
		}else{
			$response["data"] = $ws->getAsArray();

			$apps_obj = $this->get("app.workspaces_apps")->getApps($workspaceId);
			$apps = Array();
			foreach ($apps_obj as $app_obj){
				$apps[] = $app_obj->getAsArray();
			}
            $response["data"]["apps"] = $apps;

			$users_obj = $this->get("app.workspace_members")->getMembers($workspaceId,$this->getUser()->getId());
			$users = Array();
			foreach($users_obj as $user_obj){
                $users[] = $user_obj["user"]->getAsArray();
            }
			$response["data"]["members"] = $users;

            $response["data"]["currentUser"] = $this->getUser()->getAsArray();
            $level = $this->get("app.workspace_levels")->getLevel($workspaceId, $this->getUser()->getId());
            $workspaceApps = $this->get("app.workspaces_apps")->getApps($workspaceId, $this->getUser()->getId(), false, false);
            $level = $this->get("app.workspace_levels")->fixLevels(Array($level),$workspaceApps)["levels"][0];

            $response["data"]["currentUser"]["level"] = $level;
		}

		return new JsonResponse($response);
	}
	/**
	 * Récupère les informations de base d'un groupe
	 */
	public function createAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$name = $request->request->get("name");
		$groupId = $request->request->getInt("groupId", 0);

		if(!$groupId){
			//Auto create group
			$uniquename = $this->get("app.string_cleaner")->simplify($name);
			$plan = $this->get("app.pricing_plan")->getMinimalPricing();
			$planId = $plan->getId();
			$group = $this->get("app.groups")->create($this->getUser()->getId(), $name, $uniquename, $planId);
			$groupId = $group->getId();
		}

		$ws = $this->get("app.workspaces")->create($name, $groupId, $this->getUser()->getId());

		if(!$ws){
			$response["errors"][] = "notallowed";
		}else{
			$response["data"] = "success";
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
			$workspaceId = $request->request->getInt("workspaceId");
			$ok = $this->get("app.workspaces")->remove(0, $workspaceId);
			if($ok){
				$data["data"] = "success";
			}
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);
	}

	public function setIdentityAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$firstname = $request->request->get("firstname", "");
			$lastname = $request->request->get("lastname", "");

			if(isset($_FILES["thumbnail"])) {
				$thumbnail = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["thumbnail"], "prfl");
				$thumbnail = $thumbnail[0];

				if (count($thumbnail["errors"])>0) {
					$data["errors"][] = "badimage";
				} else {
					$this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname, $thumbnail["file"]);
				}
			}else{
				$this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname);
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

        $workspaceId = $request->request->getInt("workspaceId");

        $ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());
        if(!$ws){
            $response["errors"][] = "notallowed";
        }else{
            $apps_obj = $this->get("app.workspaces_apps")->getApps($workspaceId);
            $apps = Array();
            foreach ($apps_obj as $app_obj){
                $apps[] = $app_obj->getAsArray();
            }
            $response["data"]["apps"] = $apps;
        }

        return new JsonResponse($response);
    }

    /**
     * Récupère les applications d'un workspace
     */
    public function getModuleAppsAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->getInt("workspaceId");

        $ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());
        if(!$ws){
            $response["errors"][] = "notallowed";
        }else{
            $apps_obj = $this->get("app.workspaces_apps")->getApps($workspaceId,null,true);
            $apps = Array();
            foreach ($apps_obj as $app_obj){
                $apps[] = $app_obj->getAsArray();
            }
            $response["data"]["apps"] = $apps;
        }

        return new JsonResponse($response);
    }

    /**
     * desactive une application d'un workspace
     */
    public function disableAppAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->getInt("workspaceId");
        $appId = $request->request->getInt("appId");

        $res = $this->get("app.workspaces_apps")->disableApp($workspaceId,$appId);
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

        $workspaceId = $request->request->getInt("workspaceId");
        $appId = $request->request->getInt("appId");

        $res = $this->get("app.workspaces_apps")->enableApp($workspaceId,$appId);
        if(!$res){
            $response["errors"][] = "notauthorized";
        }else{
            $response["data"][] = "success";
        }

        return new JsonResponse($response);
    }

}
