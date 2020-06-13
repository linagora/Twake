<?php

namespace Twake\Tasks\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class BoardList extends BaseController
{


    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.list")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function archiveAll(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.list")->archiveAllTasks($object, $options, $this->getUser());
        if ($res === false) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("status" => "ok"));
    }

    public function removeAll(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.list")->removeAllTasks($object, $options, $this->getUser());
        if ($res === false) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("status" => "ok"));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.list")->save($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.tasks.list")->get($options, $this->getUser());
        if ($objects === false) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => $objects));
    }

}