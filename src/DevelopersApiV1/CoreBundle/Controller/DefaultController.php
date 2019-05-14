<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 08/06/18
 * Time: 14:17
 */

namespace DevelopersApiV1\CoreBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends Controller{

    public function getInfoFromTokenAction(Request $request){
         $info = $this->get("api.v1.check_user_data")->getInfo($request->request->get("token", null));
         if($info)
             return new JsonResponse($info->getAsArray());
         else
             return new JsonResponse(array("error" => "invalid_token"));
    }

    public function BadRequestAction()
    {
        return new JsonResponse(Array("errors" => "0000", "description" => "Bad request"));
    }
}