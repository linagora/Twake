<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 08/06/18
 * Time: 14:17
 */

namespace DevelopersApiV1\Core\Controller;


use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Base extends BaseController
{

    public function getInfoFromToken(Request $request)
    {
        $info = $this->get("api.v1.check_user_data")->getInfo($request->request->get("token", null));
        if ($info)
            return new Response($info->getAsArray());
        else
            return new Response(array("error" => "invalid_token"));
    }

    public function BadRequest()
    {
        return new Response(Array("errors" => "0000", "description" => "Bad request"));
    }
}