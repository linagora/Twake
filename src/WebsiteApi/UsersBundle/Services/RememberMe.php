<?php

namespace WebsiteApi\UsersBundle\Services;

use Symfony\Component\Security\Http\RememberMe\TokenBasedRememberMeServices;
use FOS\UserBundle\Security\EmailUserProvider;
use Symfony\Component\DependencyInjection\ContainerInterface;

class RememberMe
{

	private $container;

	public function __construct(ContainerInterface $container) {
		$this->container = $container;
	}

	public function doRemember($request, &$response, $token){

		$providerKey = $this->container->getParameter('fos_user.firewall_name');
		$key = $this->container->getParameter('secret');

		$userManager = $this->container->get('fos_user.user_manager');
		$userProvider = new EmailUserProvider($userManager);

		$rememberMeService = new TokenBasedRememberMeServices(
			array($userProvider),
			$key,
			$providerKey,
			array(
				'path' => '/',
				'name' => 'REMEMBERME',
				'domain' => null,
				'secure' => false,
                "httponly" => true,
				'lifetime' => 60*60*24*360,
				'always_remember_me' => true,
				'remember_me_parameter' => '_remember_me')
		);

		$rememberMeService->loginSuccess($request, $response, $token);

	}

}