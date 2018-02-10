<?php

namespace WebsiteApi\NotificationsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction()
    {
        return $this->render('TwakeNotificationsBundle:Default:index.html.twig');
    }
}
