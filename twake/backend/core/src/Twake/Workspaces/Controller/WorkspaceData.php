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


class WorkspaceData extends BaseController
{

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

        return new Response($response);

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

        return new Response($data);

    }

    public function getUploader()
    {
        $storagemanager = $this->get("driveupload.storemanager");
        if(!$provider){
            $provider = $storagemanager->getOneProvider();
        }
        $configuration = $storagemanager->getProviderConfiguration($provider);
        
        if ($configuration["type"] === "S3") {
            $uploader = $this->get("app.aws_uploader");
        }else if ($configuration["type"] === "openstack") {
            $uploader =$this->get("app.openstack_uploader");
        }else{
            $uploader = $this->get("app.uploader");
        }
        $uploader->configure($configuration);
        return $uploader;
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

        return new Response($data);

    }

}
