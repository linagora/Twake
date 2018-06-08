<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 08/06/18
 * Time: 14:17
 */

namespace DevelopersApiV1\CoreBundle\Controller;


use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Tests\Controller;

class DefaultController extends Controller{

    public function getInfoFromTokenAction($token){
        $data = $this->get("website_api_market.data_token")->getDataToken($token);
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$data));
    }
}