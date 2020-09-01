<?php

namespace Twake\Channels\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class ChannelsNotifications extends BaseController
{

    public function mute(Request $request)
    {
        $channel_id = $request->request->get("channel_id");
        $mute = $request->request->get("mute", 1);
        if(!is_integer($mute)){
            $mute = $mute?2:0;
        }
        $res = $this->get("app.channels.notifications")->mute($channel_id, $mute, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function unread(Request $request)
    {
        $channel_id = $request->request->get("channel_id");
        $res = $this->get("app.channels.notifications")->unread($channel_id, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function read(Request $request)
    {
        $channel_id = $request->request->get("channel_id");
        $res = $this->get("app.channels.notifications")->read($channel_id, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

}