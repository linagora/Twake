<?php
/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace WebsiteApi\WorkspacesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\WorkspacesBundle\Model\WorkspaceLevelsInterface;


class WorkspaceLevelsController extends Controller
{
    /**
     * Get list of workspace levels
     */
    public function getLevelsAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");

        $levels = $this->get("app.workspace_levels")->getLevels($workspaceId, $this->getUser()->getId());
        $workspaceApps = $this->get("app.workspaces_apps")->getApps($workspaceId, $this->getUser()->getId(), false, true);

        if ($levels == null) {
            $response["errors"] = "notauthorized";
            return new JsonResponse($response);
        }

        $list = $this->get("app.workspace_levels")->fixLevels($levels, $workspaceApps);

        $list["apps"] = Array();
        $list["apps"]["workspace"] = "Workspace";
        if ($workspaceApps != null) {
            foreach ($workspaceApps as $workspaceApp) {
                $list["apps"][$workspaceApp->getPublicKey()] = $workspaceApp->getName();
            }
        }

        $response["data"] = $list;

        return new JsonResponse($response);
    }

    /**
     * Create a workspace level
     */
    public function createLevelAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $label = $request->request->get("label", "");
        if ($label == null) {
            $response["errors"] = "emptylabel";
            return new JsonResponse($response);
        }

        $rights = $this->get("app.workspace_levels")->getDefaultLevel($workspaceId)->getRights();

        $res = $this->get("app.workspace_levels")->addLevel($workspaceId, $label, $rights, $this->getUser()->getId());

        if ($res) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }

    /**
     * Delete a workspace level
     */
    public function deleteLevelAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $levelId = $request->request->get("levelId");

        $res = $this->get("app.workspace_levels")->removeLevel($workspaceId, $levelId, $this->getUser()->getId());

        if ($res) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }

    /**
     * Make a workspace levels default
     */
    public function makeDefaulLevelAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $levelId = $request->request->get("levelId");

        $res = $this->get("app.workspace_levels")->setDefaultLevel($workspaceId, $levelId, $this->getUser()->getId());

        if ($res) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }

    /**
     * Edit a level (name and or rights)
     */
    public function editLevelAction(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $levelId = $request->request->get("levelId");
        $rights = $request->request->get("rights");
        $label = $request->request->get("label", "");

        $res = $this->get("app.workspace_levels")->updateLevel($workspaceId, $levelId, $label, $rights, $this->getUser()->getId());

        if ($res) {
            $response["data"] = "success";
        } else {
            $response["errors"] = "notauthorized";
        }

        return new JsonResponse($response);
    }

    public function getByLabelAction(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $label = $request->request->get("label", "");

        $res = $this->get("app.workspace_levels")->getByLabel($workspaceId, $label);
        $labels = [];
        if (!$res) {
            $response["errors"] = "notauthorized";
        } else {
            foreach ($res as $label) {
                $labels[] = $label->getAsArray();
            }
            $response["data"] = $labels;
        }

        return new JsonResponse($response);
    }


}
