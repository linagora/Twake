<?php

namespace Twake\Discussion\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;
use Twake\Discussion\Entity\Channel;
use Twake\Discussion\Entity\StreamMember;


class MessageRead extends BaseController
{
    public function readMessage(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        if (!$this->getUser()) {
            $data['errors'][] = "notconnected";
        } else {
            if ($request->request->get("stream_id") != null) {
                $tmp = $this->get('app.messages')->readStream($request->request->get("stream_id"), $this->getUser());
                if ($tmp != null) {
                    $data["errors"][] = "errorSystem";
                } else {
                    $data["data"][] = "success";
                }
            }
        }
        return new Response($data);
    }

    public function readAllMessages(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        if (!$this->getUser()) {
            $data['errors'][] = "notconnected";
        } else {
            $user = $this->getUser();
            $tmp = $this->get("app.messagesNotificationsCenter")->readAll($user);
            if ($tmp) {
                $data["errors"][] = "errorSystem";
            } else {
                $data["data"][] = "success";
            }
        }
        return new Response($data);
    }

}