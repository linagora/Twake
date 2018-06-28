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

class ExternalFilesController extends Controller
{
    public function fetchAccessTokenWithAuthCodeAction(Request $request){
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $code = $request->query->get('code');

        $authCode = trim($code);

        $this->get("app.drive.ExternalDriveSystem")->completeAddingNewGDrive($authCode,$this->getUser());

        return new Response("<script>window.close();</script>");
    }

    public function addNewExternalDriveAction(Request $request){
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $targetUrl = $request->request->get("externalDriveUrl");
        $workspaceId = $request->request->get("workspaceId");

        if(count(explode("google",$targetUrl))>1){
            $targetUrl = explode("folders/",$targetUrl);
            if(count($targetUrl)<2)
                $folderId = "root";
            else
                $folderId = $targetUrl[1];

            $authUrl = $this->get("app.drive.ExternalDriveSystem")->addNewGDrive($folderId, $this->getUser(), $workspaceId);

            $data["data"]["status"] = "auth req";
            $data["data"]["url"] = $authUrl;
        }
        else
            $data["error"][] = "External drive system not handled";

        return new JsonResponse($data);
    }

    public function getExternalDrivesAction(Request $request){
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId");

        $externalDrives  = $this->get("app.drive.ExternalDriveSystem")->getExternalDrives($workspaceId);

        foreach ($externalDrives as $externalDrive) {
            $data["data"][] = $this->get("app.drive.GDriveApiSystem")->getGDriveBasicInfo($externalDrive->getFileId(), $externalDrive->getExternalToken());
        }

        return new JsonResponse($data);
    }
}
