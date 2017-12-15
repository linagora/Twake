<?php


namespace WebsiteApi\CoreBundle\Services;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Routing\Router;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Doctrine\ORM\EntityManager;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use WebsiteApi\CoreBundle\Services\RememberMe;

class BeforeRender
{

	public function __construct() {


	}

	public function beforeRender(FilterResponseEvent $event){
	        //$event->getResponse()->headers->set('Access-Control-Allow-Origin', '*'); //Allow App
		    $event->getResponse()->headers->set('Access-Control-Allow-Origin','http://localhost:8090'); //Allow App
	        $event->getResponse()->headers->set('Access-Control-Allow-Headers', ' Content-Type, *');	
	        $event->getResponse()->headers->set('Access-Control-Allow-Credentials', 'true');
	        $event->getResponse()->headers->set('Access-Control-Allow-Methods', 'GET, POST');
		$length = strlen($event->getResponse()->getContent());
		$event->getResponse()->headers->set('x-decompressed-content-length', $length);

	}



}
