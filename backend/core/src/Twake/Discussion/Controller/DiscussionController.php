<?php

namespace Twake\Discussion\Controller;

use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class DiscussionController extends BaseController
{

    public function remove(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        if ($object["ephemeral_id"]) {
            return new JsonResponse(Array("status" => "cancelled"));
        }

        $res = $this->get("app.messages")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function save(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");
        $res = $this->get("app.messages")->save($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        } else {
            if (!$object["id"]) {
                $this->get("administration.counter")->incrementCounter("total_messages", 1);
            }
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("app.messages")->get($options, $this->getUser());
        if ($objects === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $objects));
    }


}
