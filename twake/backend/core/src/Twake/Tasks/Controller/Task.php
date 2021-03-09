<?php

namespace Twake\Tasks\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Task extends BaseController
{


    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.task")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }else{
            if($GLOBALS["segment_enabled"]) \Segment::track([
                "event" => "tasks:task:remove",
                "userId" => $this->getUser()->getId()
            ]);
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.task")->save($object, $options, $this->getUser());

        if (!$object["id"]) {
            $this->get("administration.counter")->incrementCounter("total_tasks", 1);
            if($GLOBALS["segment_enabled"]) \Segment::track([
                "event" => "tasks:task:create",
                "userId" => $this->getUser()->getId()
            ]);
        }

        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.tasks.task")->get($options, $this->getUser());
        if ($objects === false) {
            return new Response(Array("status" => "error"));
        }else{
            if($GLOBALS["segment_enabled"]) \Segment::track([
                "event" => "tasks:task:get",
                "userId" => $this->getUser()->getId()
            ]);
        }
        return new Response(Array("data" => $objects));
    }

}