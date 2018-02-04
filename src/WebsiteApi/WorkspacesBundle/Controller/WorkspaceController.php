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

			$apps_obj = $this->get("app.workspaces")->getApps($workspaceId);
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

}
