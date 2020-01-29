<?php

namespace WebsiteApi\GlobalSearchBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TagController extends Controller
{

    public function removeAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $res = $this->get("globalsearch.tag")->remove($object, $options, $this->getUser());
        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function saveAction(Request $request)
    {
        $options = $request->request->get("options");
        $object = $request->request->get("object");

        $res = $this->get("globalsearch.tag")->save($object, $options, $this->getUser(), Array());

        if (!$res) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => Array("object" => $res)));


    }

    public function getAction(Request $request)
    {
        $options = $request->request->get("options");
        $objects = $this->get("globalsearch.tag")->get($options, $this->getUser());

        if ($objects === false) {
            return new JsonResponse(Array("status" => "error"));
        }
        return new JsonResponse(Array("data" => $objects));
    }

}

