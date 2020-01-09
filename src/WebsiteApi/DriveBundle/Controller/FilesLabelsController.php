<?php

namespace WebsiteApi\DriveBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class FilesLabelsController extends Controller
{

    public function getAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $groupId = $request->request->get("groupId", 0);

        $labels = $this->get('app.drive.Labels')->get($groupId);
        $json_labels = Array();
        foreach ($labels as $label) {
            $json_labels[] = $label->getAsArray();
        }
        $data["data"] = $json_labels;

        return new JsonResponse($data);

    }


    public function updateAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $groupId = $request->request->get("groupId", 0);
        $labels = $request->request->get("labels", null);


        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "drive:write")) {
            $this->get('app.drive.Labels')->update($groupId, $labels);

            $data["data"] = "success";
        }

        return new JsonResponse($data);

    }

}
