<?php

namespace WebsiteApi\PaymentsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

class DefaultController extends Controller
{


    public function sendMailAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $groupId = $request->request->get("group_id");
        $timeleft = $request->request->get("timeleft");

        $this->get("app.mail_sender")->sendEndPeriodsMail($groupId, $timeleft);
        return new JsonResponse($data);
    }
}
