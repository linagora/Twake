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
            if($request->request->get("stream_id") != null){
                $tmp = $this->get('app.messages')->readStream($request->request->get("stream_id"), $this->getUser());
                if($tmp != null){
                    $data["errors"][] = "errorSystem";
                }else{
                    $data["data"][] = "success";
                }
            }
        }
        return new JsonResponse($data);
    }

    public function readAllMessagesAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            $user = $this->getUser();
            $tmp = $this->get("app.messagesNotificationsCenter")->readAll($user);
            var_dump($tmp);
            if(!$tmp) {
                $data["errors"][] = "errorSystem";
            }else{
                $data["data"][] = "success";
            }
        }
        return new JsonResponse($data);
    }

}