<?php

namespace WebsiteApi\EventsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction()
    {
        return $this->render('TwakeEventsBundle:Default:index.html.twig');
    }
}
