<?php

namespace WebsiteApi\GlobalSearchBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class TagController extends Controller
{

    public function removeAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

//        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
//            "type" => "DriveFile",
//            "object_id" => $object["id"],
//            "edition" => true
//        ), Array("token" => $options["public_access_token"]));
//        if (!$acces) {
//            return new JsonResponse(Array("error" => "access_denied"));
//        }

        $res = $this->get("globalsearch.tag")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function saveAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

//        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
//            "type" => "DriveFile",
//            "object_id" => isset($object["id"]) ? $object["id"] : $object["parent_id"], //Ability to add element to parent, or to edit current element
//            "edition" => true
//        ), Array("token" => $options["public_access_token"]));
//        if (!$acces) {
//            return new JsonResponse(Array("error" => "access_denied"));
//        }

//        $file_uploaded = null;
//        if (isset($_FILES["file"])) {
//            $options = json_decode($options, true);
//            $object = json_decode($object, true);
//            $file_uploaded = $_FILES["file"];
//        } else {
//            $file_uploaded = $object["file_url"] ? $object["file_url"] : $request->request->get("file_url");
//        }

//        $current_user = $this->getUser();
//        $current_user_id = $current_user->getId();

        $current_user_id = "3aa48caa-ad60-11e9-8cdf-0242ac1d0005";
//
//        if ($file_uploaded) {
//            //If object[_once_new_version] is set a new version is added
//            $res = $this->get('driveupload.upload')->uploadDirectly($file_uploaded, $object, $options, $current_user_id);
//        } else {
//            $res = $this->get("app.drive")->save($object, $options, $current_user_id, Array());
//        }

        $res = $this->get("globalsearch.tag")->save($object, $options, $current_user_id, Array());

        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));


    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");

//        $acces = $this->get('app.accessmanager')->has_access($this->getUser()->getId(), Array(
//            "type" => "DriveFile",
//            "object_id" => $options["directory_id"],
//            "workspace_id" => $options["workspace_id"]
//        ), Array("token" => $options["public_access_token"]));
//        if (!$acces) {
//            return new JsonResponse(Array("error" => "access_denied"));
//        }

        $objects = $this->get("globalsearch.tag")->get($options, $this->getUser());

        if ($objects === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $objects));
    }

}

