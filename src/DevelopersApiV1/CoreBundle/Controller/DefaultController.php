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
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }
        $token = $request->request->get("token", 0);
        $data = $this->get("website_api_market.data_token")->getDataToken($token);
        if(!$data)
            return new JsonResponse($this->get("api.v1.api_status")->getError(3));
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$data));
    }

    public function BadRequestAction()
    {
        return new JsonResponse(Array("errors" => "0000", "description" => "Bad request"));
    }
}