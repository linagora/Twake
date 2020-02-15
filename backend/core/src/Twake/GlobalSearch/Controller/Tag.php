<?php

namespace Twake\GlobalSearch\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Tag extends BaseController
{

    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $res = $this->get("globalsearch.tag")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $res = $this->get("globalsearch.tag")->save($object, $options, $this->getUser(), Array());

        if (!$res) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => Array("object" => $res)));


    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("globalsearch.tag")->get($options, $this->getUser());

        if ($objects === false) {
            return new Response(Array("status" => "error"));
        }
        return new Response(Array("data" => $objects));
    }

}

