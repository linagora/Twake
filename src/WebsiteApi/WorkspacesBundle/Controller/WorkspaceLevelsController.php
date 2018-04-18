<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace WebsiteApi\WorkspacesBundle\Controller;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspaceLevelsInterface;
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

    /**
     * Get list of workspace levels
     */
    public function createLevelAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->getInt("workspaceId");
        $label = $request->request->get("label");
        $rights = $this->get("app.workspace_levels")->getDefaultLevel($workspaceId)->getRights();

        $res = $this->get("app.workspace_levels")->addLevel($workspaceId,$label,$rights, $this->getUser()->getId());

        if ($res){
            $response["data"] = "success";
        }else{
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }



}
