<?php
/**
 * Created by PhpStorm.
 * User: yoanf
 * Date: 24/04/2018
 * Time: 16:54
 */

namespace WebsiteApi\WorkspacesBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GroupController extends Controller
{

    public function changeNameAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $name = $request->request->get("name");

        $res = $this->get("app.groups")->changeData($groupId,$name,$this->getUser()->getId());

        if(!$res){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"][] = true;
        }

        return new JsonResponse($response);
    }
}