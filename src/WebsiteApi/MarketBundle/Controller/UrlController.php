<?php

/**
 * Created by PhpStorm.
 * User: Syma
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

        $url = $request->request->get("url", "");

        $res = $this->get("website_api_market.applications")->getAppForUrl($url);

        if ($res) {
            $res = $res->getAsArray();
        }

        return new JsonResponse($res);

    }

}
