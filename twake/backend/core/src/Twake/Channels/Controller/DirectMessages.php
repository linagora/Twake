<?php

namespace Twake\Channels\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class DirectMessages extends BaseController
{


    public function remove(Request $request)
    {
        return new Response(Array("status" => "error"));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.channels.direct_messages_system")->save($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.channels.direct_messages_system")->get($options, $this->getUser());
        if ($objects === false) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => $objects));
    }

}