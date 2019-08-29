<?php

namespace WebsiteApi\DriveBundle\Controller;

use PHPUnit\Util\Json;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class DriveFileRefactoController extends Controller
{

    public function removeAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
            "type" => "DriveFile",
            "object_id" => $object["id"],
            "edition" => true
        ), Array("token" => $options["public_access_token"]));
        if (!$acces) {
            return new JsonResponse(Array("error" => "access_denied"));
        }

        $res = $this->get("app.drive_refacto")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function saveAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
            "type" => "DriveFile",
            "object_id" => isset($object["id"]) ? $object["id"] : $object["parent_id"], //Ability to add element to parent, or to edit current element
            "edition" => true
        ), Array("token" => $options["public_access_token"]));
        if (!$acces) {
            return new JsonResponse(Array("error" => "access_denied"));
        }

        $file_uploaded = null;
        if (isset($_FILES["file"])) {
            $options = json_decode($options, true);
            $object = json_decode($object, true);
            $file_uploaded = $_FILES["file"];
        } else {
            $file_uploaded = $object["file_url"] ? $object["file_url"] : $request->request->get("file_url");
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        if ($file_uploaded) {
            //If object[_once_new_version] is set a new version is added
            $res = $this->get('driveupload.upload')->uploadDirectly($file_uploaded, $object, $options, $current_user_id);
        } else {
            $res = $this->get("app.drive_refacto")->save($object, $options, $current_user_id, Array());
        }

        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        } else {
            $this->get("administration.counter")->incrementCounter("total_files", 1);
            $this->get("administration.counter")->incrementCounter("total_files_size", intval($res["size"] / 1000));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");

        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
            "type" => "DriveFile",
            "object_id" => $options["directory_id"],
            "workspace_id" => $options["workspace_id"]
        ), Array("token" => $options["public_access_token"]));
        if (!$acces) {
            return new JsonResponse(Array("error" => "access_denied"));
        }

        $objects = $this->get("app.drive_refacto")->get($options, $this->getUser());

        if ($objects === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $objects));
    }

    public function findAction(Request $request)
    {
        $options = $request->request->get("options");

        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
            "type" => "DriveFile",
            "object_id" => $options["element_id"],
            "workspace_id" => $options["workspace_id"],
        ), Array("token" => $options["public_access_token"]));
        if (!$acces) {
            return new JsonResponse(Array("error" => "access_denied"));
        }

        $object = $this->get("app.drive_refacto")->find($options, $this->getUser());

        if ($object === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $object));
    }


    public function set_file_accessAction(Request $request)
    {

        $file_id = $request->request->get("file_id");

        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
            "type" => "DriveFile",
            "object_id" => $file_id
        ), Array());
        if (!$acces) {
            return new JsonResponse(Array("error" => "access_denied"));
        }

        $is_editable = $request->request->get("is_editable");
        $publicaccess = $request->request->get("public_access");
        $authorized_members = $request->request->get("authorized_members");
        $authorized_channels = $request->request->get("authorized_channels");

        $publicaccess = $this->get('app.drive_refacto')->set_file_access($file_id, $publicaccess, $is_editable, $authorized_members, $authorized_channels, $this->getUser());
        $data = Array("data" => $publicaccess);

        return new JsonResponse($data);
    }

    public function reset_file_accessAction(Request $request)
    {
        $file_id = $request->request->get("file_id");

        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
            "type" => "DriveFile",
            "object_id" => $file_id
        ), Array());
        if (!$acces) {
            return new JsonResponse(Array("error" => "access_denied"));
        }

        $publicaccess = $this->get('app.drive_refacto')->reset_file_access($file_id, $this->getUser());
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
            $data["data"] = $this->get('app.drive_refacto')->emptyTrash($groupId, $this->getUser());
        }

        return new JsonResponse($data);
    }

}
