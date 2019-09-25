<?php

/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/06/2017
 * Time: 11:56
 */

namespace WebsiteApi\MarketBundle\Controller;

use DevelopersApi\UsersBundle\Entity\Token;
use phpDocumentor\Reflection\Types\Array_;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\MarketBundle\Entity\Application;

class UrlController extends Controller
{

    public function testUrlAction(Request $request)
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
