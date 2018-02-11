<?php

namespace WebsiteApi\NotificationsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class DefaultController extends Controller
{
    public function initAction()
    {
        return new JsonResponse(Array("hey !"));
    }
}
