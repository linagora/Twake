<?php

namespace Twake\Calendar\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Calendar extends BaseController
{


    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.calendar.calendar")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.calendar.calendar")->save($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }else{
            if($GLOBALS["segment_enabled"]) \Segment::track([
                "event" => "calendar:".($object["id"] ? "edit" : "create"),
                "userId" => $this->getuser()->getIdentityProviderId() ?: $this->getUser()->getId()
            ]);
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.calendar.calendar")->get($options, $this->getUser());
        if ($objects === false) {
            return new Response(Array("status" => "error"));
        }else{
            if($GLOBALS["segment_enabled"]) \Segment::track([
                "event" => "calendar:open",
                "userId" => $this->getuser()->getIdentityProviderId() ?: $this->getUser()->getId()
            ]);
        }

        return new Response(Array("data" => $objects));
    }

}