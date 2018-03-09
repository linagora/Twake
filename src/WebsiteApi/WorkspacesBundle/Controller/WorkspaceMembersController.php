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


class WorkspaceMembersController extends Controller
{
	/**
	 * Get list of workspace members
	 */
	public function getMembersAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");

		$members = $this->get("app.workspace_members")->getMembers($workspaceId, $this->getUser()->getId());

		$list = Array();
		foreach ($members as $member){
			$list[] = Array(
				"user" => $member["user"]->getAsArray(),
				"level" => $member["level"]->getAsArray()
			);
		}

		$pendingMails = $this->get("app.workspace_members")->getPendingMembers($workspaceId, $this->getUser()->getId());

		$listMails = Array();
		foreach ($pendingMails as $mail){
			$listMails[] = Array(
				"mail" => $mail->getMail()
			);
		}

		$response["data"] = Array(
			"mails" => $listMails,
			"members" => $list
		);

		return new JsonResponse($response);
	}

	/**
	 * Add list of usernames or mails
	 */
	public function addListAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");
		$list = $request->request->get("list", "");

		$list = str_replace(Array(",",";"), " ", $list);
		$list = preg_replace('!\s+!', ' ', $list);
		$list = explode(" ", $list);

		$added = Array();
		$not_added = Array();
		foreach ($list as $element){
			$element = trim($element);
			if(strrpos($element, "@")<=0) { //No mail or "@username"
				$res = $this->get("app.workspace_members")
					->addMemberByUsername($workspaceId, $element, $this->getUser()->getId());
			}else{
				$res = $this->get("app.workspace_members")
					->addMemberByMail($workspaceId, $element, $this->getUser()->getId());
			}
			if($res){
				$added[] = $element;
			}else{
				$not_added[] = $element;
			}
		}

		$response["data"]["added"] = $added;
		$response["data"]["not_added"] = $not_added;

		return new JsonResponse($response);
	}

	/**
	 * Remove e-mail wainting for add
	 */
	public function removeMailAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");
		$mail = $request->request->get("mail","");

		$res = $this->get("app.workspace_members")
			->removeMemberByMail($workspaceId, $mail, $this->getUser()->getId());

		$response["data"] = $res;

		return new JsonResponse($response);
	}

	/**
	 * Remove list of members by ids
	 */
	public function removeMembersAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");
		$ids = $request->request->get("ids",Array());

		$removed = 0;
		foreach ($ids as $id) {
			$res = $this->get("app.workspace_members")
				->removeMember($workspaceId, $id, $this->getUser()->getId());
			if($res){
				$removed++;
			}
		}

		$response["data"]["removed"] = $removed;

		return new JsonResponse($response);
	}

	/**
	 * Change level of members
	 */
	public function changeMembersLevelAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");
		$ids = $request->request->get("ids",Array());
		$levelId = $request->request->get("levelId",0);

		$updated = 0;
		foreach ($ids as $id) {
			$res = $this->get("app.workspace_members")
				->changeLevel($workspaceId, $id, $levelId, $this->getUser()->getId());
			if($res){
				$updated++;
			}
		}

		$response["data"]["updated"] = $updated;

		return new JsonResponse($response);
	}

}
