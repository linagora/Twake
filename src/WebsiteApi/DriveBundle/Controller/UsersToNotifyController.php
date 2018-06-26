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

class UsersToNotifyController extends Controller
{

    public function getUsersAction(Request $request)
    {
        //TODO : check auth

        $driveFileId = $request->request->get("driveFileId", 0);

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($driveFileId == 0) {
            $data["errors"][] = "Error file not found";
            return new JsonResponse($data);
        }

        $usersList = $this->get("app.drive.UserToNotifyService")->get($driveFileId);
        $data["data"]["usersList"] = Array();

        foreach ($usersList as $user) {
            if ($user != null)
                array_push($data["data"]["usersList"], $user->getUser()->getAsArray());
            else
                var_dump("null user to notify");
        }

        return new JsonResponse($data);

    }

    public function setUsersAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        //TODO : check auth

        $driveFileId = $request->request->get("driveFileId", 0);
        $usersList = $request->request->get("usersList", 0);

        $this->get("app.drive.UserToNotifyService")->setUsersList($driveFileId, $usersList);

        return $this->getUsersAction($request);
    }

}
