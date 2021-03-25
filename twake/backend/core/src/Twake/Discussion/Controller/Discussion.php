<?php

namespace Twake\Discussion\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class Discussion extends BaseController
{

    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        if ($object["ephemeral_id"]) {
            return new Response(Array("status" => "cancelled"));
        }

        $res = $this->get("app.messages")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }

        return new Response(Array("data" => Array("object" => $res)));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.messages")->save($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        } else {
            if (!$object["id"]) {
                $this->get("administration.counter")->incrementCounter("total_messages", 1);
                if($GLOBALS["segment_enabled"]) \Segment::track([
                    "event" => "message:send",
                    "userId" => $this->getuser()->getIdentityProviderId() ?: $this->getUser()->getId()
                ]);
            }
        }

        return new Response(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.messages")->get($options, $this->getUser());
        if ($objects === false) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => $objects));
    }


}
