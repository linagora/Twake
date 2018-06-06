<?php

namespace WebsiteApi\CoreBundle\Controller;

use RMS\PushNotificationsBundle\Message\iOSMessage;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class VersionController extends Controller
{

    public function getAction()
    {

        return new JsonResponse(Array("version" => "1.1.0-0"));


    }

    public function quoteAction()
    {

        $quote = "No quote is better than -1 quote.";
        $subquote = "The developer of this feature";

        return new JsonResponse(Array("quote" => $quote, "subquote" => $subquote));


    }

}