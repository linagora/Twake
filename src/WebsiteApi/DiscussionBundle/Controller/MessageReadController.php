<?php

namespace WebsiteApi\DiscussionBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\DiscussionBundle\Entity\StreamMember;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;


class MessageReadController extends Controller
{
    public function readMessageAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            if($request->request->get("key") != null){
                if(!$this->get('app.messageReadSystem')->readByKey($request->request->get("key"),$this->getUser())){
                    $data["errors"][] = "errorSystem";
                }
            }
        }
        return new JsonResponse($data);
    }


}