<?php
/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace Twake\Workspaces\Controller;

use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class WorkspaceDataController extends BaseController
{
    /**
     * Get workspace data
     */
    public function getDetails(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");

        $ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());

        if (!$ws) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"] = $ws->getAsArray();
            $mw = $this->get("app.workspace_members");
            $response["data"]["total_members"] = count($mw->getMembers($workspaceId)) + count($mw->getPendingMembers($workspaceId)) - 1;
            $response["data"]["isArchived"] = $ws->getisArchived();
        }

        return new JsonResponse($response);
    }

    public function setName(Request $request)
    {

        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $name = $request->request->get("name", null);

        $ok = false;
        if ($name != null) {
            $ok = $this->get("app.workspaces")->changeName($workspaceId, $name, $this->getUser()->getId());
        }

        if (!$ok) {
            $response["errors"][] = "error";
        } else {
            $response["data"] = "success";
        }

        return new JsonResponse($response);

    }

    public function setLogo(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");

        if (!$this->get("app.workspace_levels")->can($workspaceId, $this->getUser()->getId(), "workspace:write")) {
            $data["errors"][] = "notallowed";
        } else {

            if (isset($_FILES["logo"])) {
                $thumbnail = $this->getUploader()->uploadFiles($this->getUser(), $_FILES["logo"], "wslogo");
                $thumbnail = $thumbnail[0];

                if (count($thumbnail["errors"]) > 0) {
                    $data["errors"][] = "badimage";
                } else {

                    $workspace = $this->get("app.workspaces")->changeLogo($workspaceId, $thumbnail["file"], $this->getUser()->getId(), $this->getUploader());
                }
            } else {
                $workspace = $this->get("app.workspaces")->changeLogo($workspaceId, null, $this->getUser()->getId(), $this->getUploader());
            }

        }

        if ($workspace) {
            $data["data"] = $workspace->getAsArray();
        }

        return new JsonResponse($data);

    }

    public function getUploader()
    {
        $aws = $this->getParameter('aws');
        if (isset($aws["S3"]["use"]) && $aws["S3"]["use"]) {
            return $this->get("app.aws_uploader");
        }
        $openstack = $this->getParameter('openstack');
        if (isset($openstack["use"]) && $openstack["use"]) {
            return $this->get("app.openstack_uploader");
        }
        return $this->get("app.uploader");
    }

    public function setWallpaper(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");

        if (!$this->get("app.workspace_levels")->can($workspaceId, $this->getUser()->getId(), "workspace:write")) {
            $data["errors"][] = "notallowed";
        } else {

            if (isset($_FILES["wallpaper"])) {
                $thumbnail = $this->getUploader()->uploadFiles($this->getUser(), $_FILES["wallpaper"], "wswall");

                $thumbnail = $thumbnail[0];

                if (count($thumbnail["errors"]) > 0) {
                    $data["errors"][] = "badimage";
                } else {
                    $color = null;
                    $this->get("app.workspaces")->changeWallpaper($workspaceId, $thumbnail["file"], $color, $this->getUser()->getId(), $this->getUploader());
                }
            } else {
                $this->get("app.workspaces")->changeWallpaper($workspaceId, null, null, $this->getUser()->getId(), $this->getUploader());
            }

        }

        return new JsonResponse($data);

    }

}
