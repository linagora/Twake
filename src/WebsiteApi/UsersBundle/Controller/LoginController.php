<?php

namespace WebsiteApi\UsersBundle\Controller;
use Symfony\Component\Security\Core\Authentication\Token\AnonymousToken;
use Symfony\Component\HttpFoundation\Session\Session;

use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use FOS\UserBundle\Controller\SecurityController as BaseController;
use FOS\UserBundle\Event\FilterUserResponseEvent;
use FOS\UserBundle\Event\FormEvent;
use FOS\UserBundle\Event\GetResponseUserEvent;
use FOS\UserBundle\Form\Factory\FactoryInterface;
use FOS\UserBundle\FOSUserEvents;
use FOS\UserBundle\Model\UserInterface;
use FOS\UserBundle\Model\UserManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use FOS\UserBundle\Util\CanonicalFieldsUpdater;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;
use Symfony\Component\Security\Core\Exception\UsernameNotFoundException;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\Security\Http\RememberMe\TokenBasedRememberMeServices;
use FOS\UserBundle\Security\EmailUserProvider;

use Symfony\Component\HttpFoundation\Cookie;

class LoginController extends BaseController
{

	/**
	 * Login, this extends fos user bundle (and interfaces)
	 */
	public function loginCheckAction(Request $request){

		$factory = $this->get('security.encoder_factory');

		$username = $request->request->get('_username');
		$password = $request->request->get('_password');
		$remember = $request->request->get('_remember_me');

		if($remember=="true"){
			$remember = 1;
		}else{
			$remember = 0;
		}

		$em = $this->getDoctrine();
		$repo  = $em->getRepository("TwakeUsersBundle:User"); //Entity Repository
		$user = $repo->findOneBy(Array("username"=>$username));

		if($user==null){
			$user = $repo->findOneBy(Array("email"=>$username));
		}

		if ($user!=null
			and $factory->getEncoder($user)->isPasswordValid($user->getPassword(), $password, $user->getSalt())
			) {

			$response = new JsonResponse(Array("status"=>"success","remember_me"=>$remember));

			$token = new UsernamePasswordToken($user, null, "main", $user->getRoles());

			if($remember==1){

				$this->get('app.core_remember_me_manager')->doRemember($request, $response, $token);

			}


			$this->get("security.token_storage")->setToken($token); //now the user is logged in

			//now dispatch the login event
			$request = $this->get('request_stack')->getCurrentRequest();
			$event = new InteractiveLoginEvent($request, $token);
			$this->get("event_dispatcher")->dispatch("security.interactive_login", $event);


			if($user->getTokenReset()!=null){
				$user->setTokenReset(null);
				$this->getDoctrine()->getManager()->persist($user);
				$this->getDoctrine()->getManager()->flush();
			}


			return $response;

		}

		return new JsonResponse(Array("status" => "error"));

	}

	/**
	 * Logout and remove REMEMBERME token/cookies, it reset the session too
	 *
	 * ### Response ###
	 *
	 * {
	 *   "status": "success"
	 * }
	 *
	 * ### Errors ###
	 *
	 * None
	 *
	 * @ApiDoc(
	 *  parameters = {
	 *  },
	 *
	 *  views = { "ajax" },
	 *  section = "Registration"
	 * )
	 */
	public function logoutAction(){

		$response = new Response();
		$response->headers->clearCookie('REMEMBERME');
		$response->sendHeaders();

		(new Session())->invalidate();

		return new JsonResponse(Array("errors" => Array("notconnected", "disconnected"), "status" => "success"));

	}

}