<?php


namespace Twake\Users\Controller;

use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Twake\Market\Entity\LinkAppWorkspace;

class UsersConnections extends BaseController
{

    public function alive(Request $request)
    {
        $time = microtime(true);
        $focus = $request->request->get("focus", true);
        if ($this->getUser() && $focus) {
            $this->get("app.user")->alive($this->getUser()->getId());
        }
        error_log("alive=" . (microtime(true) - $time));
        return new JsonResponse(Array("data" => "ok"));

    }

    public function autoLogin(Request $request)
    {
        $this->login($request);
        return $this->redirect($this->getParameter("SERVER_NAME"));
    }

    public function login(Request $request)
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
            if ($device && isset($device["type"]) && isset($device["value"])) {
                $this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"], isset($device["version"]) ? $device["version"] : null);
                $this->get("administration.counter")->incrementCounter("total_devices_linked", 1);
            }

            $data["data"]["status"] = "connected";

        } else {

            $data["data"]["status"] = "disconnected";

        }

        $response->setContent(json_encode($data));

        return $response;

    }

    public function mobileRedirect(Request $request)
    {
        $response = new Response();
        $response->setContent("<script>document.location='" . base64_decode($request->query->get("redirect")) . "'</script>");
        return $response;
    }

    public function isLogged(Request $request)
    {
        $ok = $this->getUser();

        if (!$ok) {
            $origin = $request->query->get("origin", "");
            $name = $request->query->get("name", "");
            $forename = $request->query->get("forename", "");
            $mail = $request->query->get("mail", "");
            $username = $request->query->get("username", "");
            $url = "https://app.twakeapp.com/?subscribe=1&origin=" . $origin;
            if ($username && $username != "") {
                $url = $url . "&username=" . $username;
            }
            if ($mail && $mail != "") {
                $url = $url . "&mail=" . $mail;
            }
            if ($name && $name != "") {
                $url = $url . "&name=" . $name;
            }
            if ($forename && $forename != "") {
                $url = $url . "&forename=" . $forename;
            }
            return $this->redirect($url);
        }
        return $this->redirect($this->getParameter("SERVER_NAME"));
    }

    public function logout(Request $request)
    {

        $device = $request->request->get("device", false);
        if ($device && isset($device["type"])) {
            $this->get("app.user")->removeDevice($this->getUser()->getId(), $device["type"], $device["value"]);
            $this->get("administration.counter")->incrementCounter("total_devices_linked", -1);
        }
        $this->get("app.user")->logout($request);
        return new JsonResponse(Array());

    }

    public function identicon(Request $request)
    {
        $username = $request->query->get("username", "");

        $tsstring = gmdate('D, d M Y H:i:s ', date("U") + 60 * 60 * 24 * 31) . 'GMT';
        header("Expires: " . $tsstring);

        //Generate identicon
        $md5 = md5($username);
        $seed1 = intval(hexdec(bin2hex(substr($md5, 0, 8))));
        $seed2 = intval(hexdec(bin2hex(substr($md5, 10, 8))));
        $seed3 = intval(hexdec(bin2hex(substr($md5, 20, 8))));

        srand($seed1);

        $colors = [
            ["#FFD300", "#A90DFF", "#1A60FF", "#531DFF"],
            ["#FF0000", "#00FFFF", "#AAFF00", "#00FF00"],
            ["#00FF00", "#FF7400", "#FF0090", "#FF0000"],
            ["#531DFF", "#FFFF00", "#FFAA00", "#FFD300"],
            ["#FCFF00", "#FF008B", "#551CFF", "#AD0DFF"],
            ["#1A60FF", "#FFD300", "#FF7400", "#FFAA00"],
            ["#FF7400", "#1A60FF", "#00FF00", "#00FFFF"],
            ["#BA0BFF", "#9EFF00", "#FFD900", "#F2FF00"]
        ];

        $colors = [
            ["#FF0000", "#FF7400", "#DD0000"],
            ["#FFAA00", "#FFD300", "#FF7400"],
            ["#531DFF", "#A90DFF", "#FF0090"],
            ["#1A60FF", "#531DFF", "#00FFFF"]
        ];

        //#3b5490 0%, #9e85ab 6%, #8d8ecc 11%, #108ee9 16%, #2359d1 53%, #4c6b9c 58%, #434c74 62%, #34446c 70%, #1a2a52 88%, #34446c 96%, #3b5490

        $colors = $colors[rand(0, count($colors) - 1)];

        /*$choosenColors = Array();
        for ($i = 0; $i < 4; $i++) {
            $choosenColors[] = $colors[rand(0, count($colors) - 1)];
        }*/
        $choosenColors = $colors;

        $equilateralMultiplicator = 0.86602540378;
        $triangleSize = 140;
        $cote = 6;

        srand($seed2);
        $colored = Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0);
        for ($i = 0; $i < 36; $i++) {
            $colored[$i] = rand(0, 1 + $colored[$i] * 3);
        }

        $draw = new \ImagickDraw();

        $background = $choosenColors[rand(0, count($choosenColors) - 1)];

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
            $draw->setFillColor($background);
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

    public function currentUser(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );


        $ok = $this->getUser();
        if (!$ok) {
            $data["errors"][] = "disconnected";
        } else {
            $device = $request->request->get("device", false);

            if ($device && isset($device["type"]) && isset($device["value"]) && $device["value"]) {
                $this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"], $device["version"]);
                $this->get("administration.counter")->incrementCounter("total_devices_linked", 1);
            }

            $this->get("app.user")->updateTimezone($this->getUser(), $request->request->get("timezone", false));

            $data["data"] = $this->getUser()->getAsArray();
            $data["data"]["workspaces_preferences"] = $this->getUser()->getWorkspacesPreference();
            $data["data"]["notifications_preferences"] = $this->getUser()->getNotificationPreference();
            $data["data"]["tutorial_status"] = $this->getUser()->getTutorialStatus();

            $data["data"]["status"] = "connected";


            $workspaces_obj = $this->get("app.workspace_members")->getWorkspaces($this->getUser()->getId());

            $workspaces = Array();
            foreach ($workspaces_obj as $workspace_obj) {
                $value = $workspace_obj["workspace"]->getAsArray();
                $value["_user_last_access"] = $workspace_obj["last_access"]->getTimestamp();
                $value["_user_hasnotifications"] = $workspace_obj["hasnotifications"];

                $workspaces[] = $value;
            }

            $mails = $this->get("app.user")->getSecondaryMails($this->getUser());

            $data["data"]["mails"] = Array();
            foreach ($mails as $mail) {
                $data["data"]["mails"][] = Array(
                    "id" => $mail->getId(),
                    "main" => ($this->getUser()->getEmail() == $mail->getMail()),
                    "email" => $mail->getMail()
                );
            }

            $data["data"]["workspaces"] = $workspaces;

        }


        return new JsonResponse($data);

    }

    public function setIsNew(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $value = $request->request->get("value");

        $ok = $this->getUser();
        if (!$ok) {
            $data["errors"][] = "disconnected";
        } else {

            $user = $this->getUser()->getId();
            $this->get("app.user")->setIsNew($value, $user);

        }

        return new JsonResponse($data);

    }

}