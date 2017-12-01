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

		$length = strlen($event->getResponse()->getContent());
		$event->getResponse()->headers->set('x-decompressed-content-length', $length);
		//$event->getResponse()->send();

	}



}