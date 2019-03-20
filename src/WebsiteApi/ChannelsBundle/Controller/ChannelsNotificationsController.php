<?php

namespace WebsiteApi\ChannelsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ChannelsNotificationsController extends Controller
{

    public function muteAction(Request $request)
    {
        $channel_id = $request->request->get("channel_id");
        $mute = $request->request->get("mute", true);
        $res = $this->get("app.channels.notifications")->mute($channel_id, $mute, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function unreadAction(Request $request)
    {
        $channel_id = $request->request->get("channel_id");
        $res = $this->get("app.channels.notifications")->unread($channel_id, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function readAction(Request $request)
    {
        $channel_id = $request->request->get("channel_id");
        $res = $this->get("app.channels.notifications")->read($channel_id, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

}