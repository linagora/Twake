<?php

namespace Twake\Calendar\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Event extends BaseController
{


    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.calendar.event")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        if($GLOBALS["segment_enabled"]) \Segment::track([
            "event" => "calendar:event:remove",
            "userId" => $this->getUser()->getId()
        ]);
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.calendar.event")->save($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        } else {
            if (!$object["id"]) {
                $this->get("administration.counter")->incrementCounter("total_events", 1);
            }
            if($GLOBALS["segment_enabled"]) \Segment::track([
                "event" => "calendar:event:".($object["id"] ? "edit" : "create"),
                "userId" => $this->getUser()->getId()
            ]);
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.calendar.event")->get($options, $this->getUser());
        if ($objects === false) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => $objects));
    }

}