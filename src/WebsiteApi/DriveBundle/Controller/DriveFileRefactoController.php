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
        $res = $this->get("app.drive_refacto")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res->getAsArray())));
    }

    public function saveAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        //$file_uploaded = null;
//        if (isset($_FILES["file"])) {
//            $options = json_decode($options, true);
//            $object = json_decode($object, true);
//            $file_uploaded = $_FILES["file"];
//        } else {
//            $file_uploaded = $object["file_url"] ? $object["file_url"] : $request->request->get("file_url");
//        }
        //$res = $this->get("app.drive_refacto")->save($object, $options, $this->getUser());
        $res = $this->get("app.drive_refacto")->save($object, $options);
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res->getAsArray())));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.drive_refacto")->get($options, $this->getUser());

        if ($objects === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $objects->getAsArray()));
    }

    public function give_file_public_accessAction(Request $request)
    {

        $file_id = $request->request->get("file_id");
        $is_editable = $request->request->get("is_editable");
        $authorized_members = $request->request->get("authorized_members");
        $authorized_channels = $request->request->get("authorized_channels");

        $publicaccess = $this->get('app.drive_refacto')->give_file_public_access($file_id,$is_editable,$authorized_members,$authorized_channels);
        $data = Array("data" => $publicaccess);

        return new JsonResponse($data);
    }

    public function give_file_private_accessAction(Request $request)
    {
        $file_id = $request->request->get("file_id");

        $publicaccess = $this->get('app.drive_refacto')->give_file_private_access($file_id);
        $data = Array("data" => $publicaccess);

        return new JsonResponse($data);
    }
}
