<?php

/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/06/2017
 * Time: 11:56
 */

namespace Twake\Market\Controller;

use DevelopersApi\Users\Entity\Token;
use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UrlController extends BaseController
{

    public function testUrl(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => null
        );

        $user = $this->getUser();
        if ($user == null)
            return new JsonResponse($data);

        $url = $request->request->get("url", "");

        $res = $this->get("app.applications")->getAppForUrl($url);

        if ($res) {
            $data["data"] = $res->getAsArray();
        } else {
            $data["errors"] = ["app_not_found"];
        }

        return new JsonResponse($data);

    }

}
