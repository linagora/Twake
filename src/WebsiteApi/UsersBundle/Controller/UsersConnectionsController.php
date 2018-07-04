<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

class UsersConnectionsController extends Controller
{

	public function aliveAction(){
		if($this->getUser()) {
			$this->get("app.user")->alive($this->getUser()->getId());
		}
		return new JsonResponse(Array());
	}

    public function autoLoginAction(Request $request)
    {
        $this->loginAction($request);
        return $this->redirect($this->getParameter("SERVER_NAME"));
    }
	public function loginAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$usernameOrMail = $request->request->get("_username", "");
		$password = $request->request->get("_password", "");
		$rememberMe = $request->request->get("_remember_me", true);

		$response = new JsonResponse();
		$loginResult = $this->get("app.user")->login($usernameOrMail, $password, $rememberMe, $request, $response);

		if ($loginResult) {

			$device = $request->request->get("device", false);
            if ($device && isset($device["type"])) {
				$this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"], $device["version"]);
			}

			$data["data"]["status"] = "connected";

		} else {

			$data["data"]["status"] = "disconnected";

		}

		$response->setContent(json_encode($data));

		return $response;

	}

    public function isLoggedAction(Request $request)
    {
        $ok = $this->get("app.user")->current();
        if(!$ok){
            return $this->redirect('https://twakeapp.com/signin');
        }
        return $this->redirect($this->getParameter("SERVER_NAME"));
    }

	public function logoutAction(Request $request)
	{

		$device = $request->request->get("device", false);
		if($device && isset($device["type"])) {
			$this->get("app.user")->removeDevice($this->getUser()->getId(), $device["type"], $device["value"]);
		}
		$this->get("app.user")->logout();
		return new JsonResponse(Array());

	}

    public function identiconAction(Request $request)
    {
        //Generate identicon
        $draw = new \ImagickDraw();

        $username = $request->query->get("username", "");
        $md5 = md5($username);
        $seed1 = intval(hexdec(bin2hex(substr($md5, 0, 8))));
        $seed2 = intval(hexdec(bin2hex(substr($md5, 10, 8))));
        $seed3 = intval(hexdec(bin2hex(substr($md5, 20, 8))));

        srand($seed1);

        $colors = ["#FEF380", "#4581F0", "#F1656F", "#0C1F43", "#FDB64C", "#86CE53", "#B001E5", "#23430C", "#47300D"];

        $choosenColors = Array();
        for ($i = 0; $i < 2; $i++) {
            $choosenColors[] = $colors[rand(0, count($colors) - 1)];
        }

        $equilateralMultiplicator = 0.86602540378;
        $triangleSize = 140;
        $cote = 6;

        srand($seed2);
        $colored = Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0);
        for ($i = 0; $i < 36; $i++) {
            if ($username != "admin") {
                $colored[$i] = rand(0, 1 + $colored[$i] * 3);
            }
        }

        srand($seed3);
        for ($i = 0; $i < 36; $i++) {
            $j = intval($i / 2);
            $offsetX = -64 + intval($j / $cote) * $triangleSize * $equilateralMultiplicator;
            $offsetY = -120 + ($j % $cote) * $triangleSize - (intval($j / $cote) % 2) * $triangleSize / 2 - $triangleSize / 2;
            if ($i % 2) {
                $points = [
                    ['x' => $offsetX, 'y' => $offsetY],
                    ['x' => $offsetX, 'y' => $offsetY + $triangleSize],
                    ['x' => $offsetX + $triangleSize * $equilateralMultiplicator, 'y' => $offsetY + $triangleSize / 2]
                ];
            } else {
                $points = [
                    ['x' => $offsetX + $triangleSize * $equilateralMultiplicator, 'y' => $offsetY + $triangleSize / 2],
                    ['x' => $offsetX + $triangleSize * $equilateralMultiplicator, 'y' => $offsetY + $triangleSize + $triangleSize / 2],
                    ['x' => $offsetX, 'y' => $offsetY + $triangleSize]
                ];
            }
            $draw->setFillColor("#FFF");
            if ($colored[$i]) {
                $draw->setFillColor($choosenColors[rand(0, count($choosenColors) - 1)]);
            }
            $draw->polygon($points);
        }

        $image = new \Imagick();
        $image->newImage(600, 600, "#FFF");
        $image->setImageFormat("png");
        $image->drawImage($draw);
        $image->flopImage();
        $image->drawImage($draw);

        if (rand(0, 1)) {
            $image->flipImage();
        }

        $r = rand(0, 22);
        $image->rotateImage("#FFF", $r);
        $w = 600 - $r * 7;
        $image->cropImage($w, $w, (600 - $w) / 2, (600 - $w) / 2);

        if (rand(0, 1)) {
            $image->flopImage();
        }


        header("Content-Type: image/png");
        echo $image->getImageBlob();
        die();
    }

	public function currentUserAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$ok = $this->get("app.user")->current();
		if(!$ok){
			$data["errors"][] = "disconnected";
		}else{

			$data["data"] = $this->getUser()->getAsArray();

			$data["data"]["status"] = "connected";

			$this->get("app.user_stats")->create($this->getUser());

			$private = $this->get("app.workspaces")->getPrivate($this->getUser()->getId());
            $workspaces_obj = $this->get("app.workspace_members")->getWorkspaces($this->getUser()->getId());

			$workspaces = Array();
			foreach ($workspaces_obj as $workspace_obj){
                $value = $workspace_obj["workspace"]->getAsArray();
                $value["last_access"] = $workspace_obj["last_access"]->getTimestamp();
                $value["isHidden"] = $workspace_obj["isHidden"];
                $value["hasNotifications"] = $workspace_obj["hasNotifications"];
                $value["isFavorite"] = $workspace_obj["isFavorite"];
                $workspaces[] = $value;
			}

			$data["data"]["workspaces"] = $workspaces;
			$data["data"]["privateworkspace"] = $private->getAsArray();

		}

		return new JsonResponse($data);

	}

	public function setIsNewAction(Request $request){
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $value=$request->request->get("value");

        $ok = $this->get("app.user")->current();
        if(!$ok){
            $data["errors"][] = "disconnected";
        }else{

            $user = $this->getUser()->getId();
            $this->get("app.user")->setIsNew($value, $user);

        }

        return new JsonResponse($data);

    }

}