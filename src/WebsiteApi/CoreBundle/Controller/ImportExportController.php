<?php

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel;

class ImportExportController extends Controller
{
    public function export_versionAction(Request $request){

        $current_user = $this->getUser();
        $group_id = $request->request->get("group_id");
        if(!(isset($current_user)))
        {
            $current_user_id = "d8a1136c-544e-11e9-9f85-0242ac120005";
        }
        else
        {
            $current_user_id= $current_user->getId();
        }
        if(!isset($group_id)){
            $group_id = "480f11b4-4747-11e9-aa8e-0242ac120005";
        }


        $this->get('app.exportversion')->export_version($group_id,true);

        return new JsonResponse("Hello");
    }


}
