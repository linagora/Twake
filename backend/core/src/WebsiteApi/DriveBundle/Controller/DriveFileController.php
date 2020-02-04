<?php

namespace WebsiteApi\DriveBundle\Controller;

use PHPUnit\Util\Json;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DriveFileController extends Controller
{

    public function removeAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $res = $this->get("app.drive")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function saveAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $file_uploaded = null;
        if (isset($_FILES["file"])) {
            $options = json_decode($options, true);
            $object = json_decode($object, true);
            $file_uploaded = $_FILES["file"];
        } else {
            $file_uploaded = isset($object["file_url"]) ? $object["file_url"] : $request->request->get("file_url");
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        if ($file_uploaded) {
            //If object[_once_new_version] is set a new version is added
            $res = $this->get('driveupload.upload')->uploadDirectly($file_uploaded, $object, $options, $current_user_id);
        } else {
            $res = $this->get("app.drive")->save($object, $options, $current_user_id, Array());
        }

        if ($object["_once_set_access"] && $object["id"]) {

            $is_editable = $object["acces_info"]["is_editable"];
            $publicaccess = $object["acces_info"]["public_access"];
            $authorized_members = $object["acces_info"]["authorized_members"];
            $authorized_channels = $object["acces_info"]["authorized_channels"];

            $res = $this->get('app.drive')->set_file_access($object["id"], $publicaccess, $is_editable, $authorized_members, $authorized_channels, $this->getUser());

        }

        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        } else {
            if (!$object["id"]) {
                $this->get("administration.counter")->incrementCounter("total_files", 1);
                $this->get("administration.counter")->incrementCounter("total_files_size", intval($res["size"] / 1000));
            }
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");

        $objects = $this->get("app.drive")->get($options, $this->getUser());

        if ($objects === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $objects));
    }

    public function findAction(Request $request)
    {
        $options = $request->request->get("options");

        $object = $this->get("app.drive")->find($options, $this->getUser());

        if ($object === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $object));
    }


    public function set_file_accessAction(Request $request)
    {

        $file_id = $request->request->get("file_id");

        $is_editable = $request->request->get("is_editable");
        $publicaccess = $request->request->get("public_access");
        $authorized_members = $request->request->get("authorized_members");
        $authorized_channels = $request->request->get("authorized_channels");

        $publicaccess = $this->get('app.drive')->set_file_access($file_id, $publicaccess, $is_editable, $authorized_members, $authorized_channels, $this->getUser());
        $data = Array("data" => $publicaccess);

        return new JsonResponse($data);
    }

    public function reset_file_accessAction(Request $request)
    {
        $file_id = $request->request->get("file_id");

        $publicaccess = $this->get('app.drive')->reset_file_access($file_id, $this->getUser());
        $data = Array("data" => $publicaccess);

        return new JsonResponse($data);
    }

    public function emptyTrashAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("workspace_id", 0);

        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write");

        if ($can || true) {
            $data["data"] = $this->get('app.drive')->emptyTrash($groupId, $this->getUser());
        }

        return new JsonResponse($data);
    }

    public function sendAsMessageAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $application = $this->get("app.applications")->findBySimpleName("twake_drive", true);

        $object = $request->request->get("message", null);
        $chan_id = $object["channel_id"];
        $file_id = $request->request->get("file_id", null);

        $object = $this->get("app.messages")->save($object, Array(), $this->getUser(), $application);

        $event = Array(
            "client_id" => "bot",
            "action" => "save",
            "object_type" => "",
            "object" => $object
        );
        $this->get("app.websockets")->push("messages/" . $chan_id, $event);

        $data["data"] = $object;

        if ($file_id) {

            $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
                "type" => "DriveFile",
                "object_id" => $file_id
            ), Array());
            if ($acces) {


                $object = $this->get("app.drive")->find(Array("element_id" => $file_id), $this->getUser());

                if ($object) {

                    $access = $object["acces_info"];

                    $is_editable = $access["is_editable"];
                    $publicaccess = $access["token"];
                    $authorized_members = $access["authorized_members"];
                    $authorized_channels = $access["authorized_channels"];
                    $authorized_channels[] = $chan_id;

                    $publicaccess = $this->get('app.drive')->set_file_access($file_id, $publicaccess, $is_editable, $authorized_members, $authorized_channels, $this->getUser());

                }

            }
        }

        return new JsonResponse($data);
    }

    public function openAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $file_id = $request->request->get("id", null);

        $bool = $this->get("app.drive")->open($file_id);

        if ($bool) {
            $data["data"][] = "success";
        } else {
            $data["data"][] = "error";
        }

        return new JsonResponse($data);
    }


}
