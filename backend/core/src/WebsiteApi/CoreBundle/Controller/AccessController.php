<?php

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class AccessController extends Controller
{

    public function has_accessAction(Request $request)
    {

        $current_user = $this->getUser();
        $data = $request->request->get("data");
        $options = $request->request->get("options");

        if (!(isset($current_user))) {
            $current_user_id = "d8a1136c-544e-11e9-9f85-0242ac120005";
        } else {
            $current_user_id = $current_user->getId();
        }

        $acces = $this->get('app.accessmanager')->has_access($current_user_id, $data, $options);
        $data = Array("data" => $acces);

        return new JsonResponse($data);
    }

    public function user_has_workspace_accessAction(Request $request)
    {
        $workspace_id = $request->request->get("workspace_id");
        $current_user = $this->getUser();
        if (!(isset($current_user))) {
            $current_user_id = "d8a1136c-544e-11e9-9f85-0242ac120005";
        } else {
            $current_user_id = $current_user->getId();
        }
        $publicaccess = $this->get('app.accessmanager')->user_has_workspace_access($current_user_id, $workspace_id);
        $data = Array("data" => $publicaccess);

        return new JsonResponse($data);
    }
}
