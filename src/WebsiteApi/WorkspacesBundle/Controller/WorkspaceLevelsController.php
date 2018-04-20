<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace WebsiteApi\WorkspacesBundle\Controller;
use phpDocumentor\Reflection\Types\Array_;
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
    public function getLevelsAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->getInt("workspaceId");

        $levels = $this->get("app.workspace_levels")->getLevels($workspaceId, $this->getUser()->getId());
        $workspaceApps = $this->get("app.workspaces_apps")->getApps($workspaceId, $this->getUser()->getId(), false, true);

        if ($levels == null) {
            $response["errors"] = "notauthorized";
            return new JsonResponse($response);
        }

        $list = $this->get("app.workspace_levels")->fixLevels($levels,$workspaceApps);

        $list["apps"] = Array();
        $list["apps"]["workspace"] = "Workspace";
        if ($workspaceApps != null){
            foreach ($list as $level){
                foreach ($workspaceApps as $workspaceApp){
                    $list["apps"][$workspaceApp->getPublicKey()] = $workspaceApp->getName();
                }
            }
        }

        $response["data"] = $list;

        return new JsonResponse($response);
    }

    /**
     * Create a workspace level
     */
    public function createLevelAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->getInt("workspaceId");
        $label = $request->request->get("label","");
        if ($label == null){
            $response["errors"] = "emptylabel";
            return new JsonResponse($response);
        }

        $rights = $this->get("app.workspace_levels")->getDefaultLevel($workspaceId)->getRights();

        $res = $this->get("app.workspace_levels")->addLevel($workspaceId,$label,$rights, $this->getUser()->getId());

        if ($res){
            $response["data"] = "success";
        }else{
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }

    /**
     * Delete a workspace level
     */
    public function deleteLevelAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->getInt("workspaceId");
        $levelId = $request->request->getInt("levelId");

        $res = $this->get("app.workspace_levels")->removeLevel($workspaceId,$levelId, $this->getUser()->getId());

        if ($res){
            $response["data"] = "success";
        }else{
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }

    /**
     * Make a workspace levels default
     */
    public function makeDefaulLevelAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->getInt("workspaceId");
        $levelId = $request->request->getInt("levelId");

        $res = $this->get("app.workspace_levels")->setDefaultLevel($workspaceId,$levelId, $this->getUser()->getId());

        if ($res){
            $response["data"] = "success";
        }else{
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }

    /**
     * Edit a level (name and or rights)
     */
    public function editLevelAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $workspaceId = $request->request->getInt("workspaceId");
        $levelId = $request->request->getInt("levelId");
        $rights = $request->request->get("rights");
        $label = $request->request->get("label","");

        $res = $this->get("app.workspace_levels")->updateLevel($workspaceId,$levelId, $label,$rights ,$this->getUser()->getId());

        if ($res){
            $response["data"] = "success";
        }else{
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }


}
