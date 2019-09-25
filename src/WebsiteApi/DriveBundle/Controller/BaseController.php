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

class BaseController extends Controller
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
            $file_uploaded = $object["file_url"] ? $object["file_url"] : $request->request->get("file_url");
        }

        $res = $this->get("app.drive")->save($object, $options, $this->getUser(), null, $file_uploaded);
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

}
