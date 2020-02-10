<?php

namespace Twake\Tasks\Controller;

use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class Board extends BaseController
{


    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.board")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.tasks.board")->save($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.tasks.board")->get($options, $this->getUser());
        if ($objects === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $objects));
    }

}