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


class WorkspaceLevelsController extends Controller
{
	/**
	 * Get list of workspace levels
	 */
	public function getLevelsAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");

		$levels = $this->get("app.workspace_levels")->getLevels($workspaceId, $this->getUser()->getId());

		$list = Array();
		foreach ($levels as $level){
			$list[] = $level->getAsArray();
		}

		$response["data"] = $list;

		return new JsonResponse($response);
	}

}
