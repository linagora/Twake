<?php

namespace WebsiteApi\MessageBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction()
    {
        return $this->render('TwakeMessageBundle:Default:index.html.twig');
    }
}
