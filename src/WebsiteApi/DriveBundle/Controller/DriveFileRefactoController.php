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
        $current_user = $this->getUser();
        if(!(isset($current_user)))
        {
            $current_user_id = "d8a1136c-544e-11e9-9f85-0242ac120005";
        }
        else
        {
            $current_user_id= $current_user->getId();
        }


        $res = $this->get("app.drive_refacto")->save($object, $options,$current_user_id);
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
