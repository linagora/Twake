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


class WorkspaceDataController extends Controller
{
	/**
	 * Get workspace data
	 */
	public function getDetailsAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$workspaceId = $request->request->getInt("workspaceId");

		$ws = $this->get("app.workspaces")->get($workspaceId, $this->getUser()->getId());

		if(!$ws){
			$response["errors"][] = "notallowed";
		}else{
			$response["data"] = $ws->getAsArray();
			$mw = $this->get("app.workspace_members");
			$response["data"]["total_members"] = count($mw->getMembers($workspaceId))+count($mw->getPendingMembers($workspaceId));
			$response["data"]["isArchived"] = $ws->getisArchived();
		}

		return new JsonResponse($response);
	}

	public function setNameAction(Request $request)
	{

		$response = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$workspaceId = $request->request->getInt("workspaceId");
		$name = $request->request->get("name", null);

		$ok = false;
		if($name!=null) {
			$ok = $this->get("app.workspaces")->changeName($workspaceId, $name, $this->getUser()->getId());
		}

		if(!$ok){
			$response["errors"][] = "error";
		}else{
			$response["data"] = "success";
		}

		return new JsonResponse($response);

	}

	public function setLogoAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$workspaceId = $request->request->getInt("workspaceId");

		if(!$this->get("app.workspace_levels")->can($workspaceId, $this->getUser()->getId(), "workspace:write")){
			$data["errors"][] = "notallowed";
		}else {

			if (isset($_FILES["logo"])) {
				$thumbnail = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["logo"], "wslogo");
				$thumbnail = $thumbnail[0];

				if (count($thumbnail["errors"]) > 0) {
					$data["errors"][] = "badimage";
				} else {

					$this->get("app.workspaces")->changeLogo($workspaceId, $thumbnail["file"], $this->getUser()->getId());
				}
			} else {
				$this->get("app.workspaces")->changeLogo($workspaceId, null, $this->getUser()->getId());
			}

		}

		return new JsonResponse($data);

	}

	public function setWallpaperAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$workspaceId = $request->request->getInt("workspaceId");

		if(!$this->get("app.workspace_levels")->can($workspaceId, $this->getUser()->getId(), "workspace:write")){
			$data["errors"][] = "notallowed";
		}else {

			if (isset($_FILES["wallpaper"])) {
				$thumbnail = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["wallpaper"], "wswall");

				$thumbnail = $thumbnail[0];

				if (count($thumbnail["errors"]) > 0) {
					$data["errors"][] = "badimage";
				} else {

                    $color = null;
                    try {
                        $image = new \Imagick($thumbnail["file"]->getLocalServerURL());
                        $image->resizeImage(250, 250, \Imagick::FILTER_GAUSSIAN, 1);
                        $image->cropImage(50, 250, 0, 0);
                        $image->quantizeImage(1, \Imagick::COLORSPACE_RGB, 0, false, false);
                        $image->setFormat('RGB');
                        $color = "#" . substr(bin2hex($image), 0, 6);
                    } catch (\ImagickException $e) {
                        $color = null;
                    }
                    $this->get("app.workspaces")->changeWallpaper($workspaceId, $thumbnail["file"], $color, $this->getUser()->getId());
				}
			} else {
                $this->get("app.workspaces")->changeWallpaper($workspaceId, null, null, $this->getUser()->getId());
			}

		}

		return new JsonResponse($data);

	}

}
