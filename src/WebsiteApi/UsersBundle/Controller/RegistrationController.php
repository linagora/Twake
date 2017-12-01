<?php

namespace WebsiteApi\UsersBundle\Controller;

use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use FOS\UserBundle\Controller\RegistrationController as BaseController;
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

class RegistrationController extends BaseController
{

	/* Configuration */
	var $registration_mailfrom = "twake@proxima.fr";
	var $registration_mailsubject = "Inscription sur Twake";

	/**
	 * Verify registration mail token is valid.
	 * IMPORTANT : Send the token by POST and not in the url like indicated !
	 * Used when the user clicks on the registration confirmation link sended by e-mail
	 *
	 * ### Response ###
	 *
	 * {
	 *   "errors": [],
	 *   "data": {
	 *     "username":
	 *   }
	 * }
	 *
	 * ### Errors ###
	 *
	 * nosuchtoken
	 *
	 * @ApiDoc(
	 *  parameters = {
	 *      {"name"="token", "dataType"="string", "required"=true, "description"="Registration token sended by e-mail"}
	 *  },
	 *
	 *  views = { "ajax" },
	 *  section = "Registration"
	 * )
	 *
	 * @param Request $request
	 * @param string  $token (not used)
	 *
	 * @return Response
	 */
	public function confirmAction(Request $request, $token)
	{

		$token = $request->request->get("token");

		/** @var $userManager \FOS\UserBundle\Model\UserManagerInterface */
		$userManager = $this->get('fos_user.user_manager');

		$user = $userManager->findUserByConfirmationToken($token);

		if (null === $user) {
			return new JsonResponse(Array("errors"=>Array("nosuchtoken")));
		}

		/** @var $dispatcher EventDispatcherInterface */
		$dispatcher = $this->get('event_dispatcher');

		//$user->setConfirmationToken(null);
		$user->setEnabled(true);

		$event = new GetResponseUserEvent($user, $request);
		$dispatcher->dispatch(FOSUserEvents::REGISTRATION_CONFIRM, $event);

		$userManager->updateUser($user);

		return new JsonResponse(Array("data"=>Array(
			"username"=>$user->getUsername()
		),"errors"=>Array()));
	}


	/**
	 * Send registration confirmation mail.
	 * The confirmation mail sent uses FOS service.
	 *
	 * ### Response ###
	 *
	 * {
	 *   "errors": [],
	 *   "status": "error"/"success"
	 * }
	 *
	 * ### Errors ###
	 *
	 * pseudou : pseudo is currently used
	 * pseudov : pseudo isn't valid
	 * mailu : mail is currently used
	 * mailv : mail isn't valid
	 *
	 * @ApiDoc(
	 *  parameters = {
	 *      {"name"="_username", "dataType"="string", "required"=true, "description"="An username"},
	 * 	    {"name"="_mail", "dataType"="string", "required"=true, "description"="An e-mail"}
	 *  },
	 *
	 *  views = { "ajax" },
	 *  section = "Registration"
	 * )
	 *
	 */
	public function checkAction(Request $request){

		$em = $this->getDoctrine()->getManager();

		$username = $request->request->get('_username');
		$mail = $request->request->get('_mail');

		$errors = Array();

		$cleanUsername = $this->get('app.string_cleaner')->simplify($username);
		$user = $em->getRepository('TwakeUsersBundle:User')->findOneBy(array('username_clean' => $cleanUsername));
		if ($user != null) {
			$errors[] = 'pseudou';
		}else if (!$this->get('app.string_cleaner')->verifyUsername($username)) {
			$errors[] = 'pseudov';
		}

		$user = $em->getRepository('TwakeUsersBundle:User')->findOneBy(array('email' => $mail)); //vérifier les mails principaux
		$user2 = $em->getRepository('TwakeUsersBundle:Mail')->findOneBy(array('mail' => $mail, "token"=>"")); //Verifier les mails secondaires
		if ($user != null or $user2 != null) {
			$errors[] = 'mailu';
		}else if (!$this->get('app.string_cleaner')->verifyMail($mail)) {
			$errors[] = 'mailv';
		}

		if(count($errors)>0){
			return new JsonResponse(array('status' => 'error', 'errors' => $errors));
		}

		//Ok, check passed

		//Delete second mails not verified
		$em->createQueryBuilder('o')
			->delete("TwakeUsersBundle:Mail", "M")
			->where("M.mail = '$mail'")
			->andWhere("M.token != ''")
			->getQuery()
			->getResult();

		/** @var $userManager UserManagerInterface */
		$userManager = $this->get('fos_user.user_manager');
		$mailer = $this->container->get('fos_user.mailer');

		$user = $userManager->createUser();
		$user->setEnabled(false);

		$user->setEmail($mail);
		$user->setUsername($username);
		$user->setUsernameClean($this->get('app.string_cleaner')->simplify($username));
		$user->setPassword(md5(date("Uu").rand(0,10000000)));

		$token = sha1(uniqid(mt_rand(), true)); // Or whatever you prefer to generate a token
		$user->setConfirmationToken($token);

		//Send confirmation message
		$data = Array(
			"pseudo" => $user->getUsername(),
			"token" => $token
		);
		$message = \Swift_Message::newInstance()
			->setSubject($this->registration_mailsubject)
			->setFrom($this->registration_mailfrom)
			->setTo($mail)
			->setBody(
				$this->get('twig')->render(
					'TwakeUsersBundle:Mail:confirm_mail.html.twig',
					$data
				),
				'text/html'
			)
			->addPart(
				$this->get('twig')->render(
					'TwakeUsersBundle:Mail:confirm_mail.txt.twig',
					$data
				),
				'text/plain'
			)
		;
		$this->get('mailer')->send($message);

		$userManager->updateUser($user);

		return new JsonResponse(array('status' => 'success'));

	}


	public function resetPsswAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$action = $request->request->get('action');
		if($action=="createToken"){
			$user = $manager->getRepository('TwakeUsersBundle:User')->findOneBy(Array('email'=>$request->request->get('mail')));
			$data = Array("" =>"");
			if($user!=null){
				$user->newTokenReset();
				$manager->persist($user);
				$manager->flush();
			}
			$data["success"] = true;

			//Send mail avec le token $user->getTokenReset();
			$dataMail = Array(
				"token"=>$user->getTokenReset()
			);

			$message = \Swift_Message::newInstance()
				->setSubject($this->registration_mailsubject)
				->setFrom($this->registration_mailfrom)
				->setTo($request->request->get('mail'))
				->setBody(
					$this->get('twig')->render(
						'TwakeUsersBundle:Mail:recovery_mail.html.twig',
						$dataMail
					),
					'text/html'
				)
				->addPart(
					$this->get('twig')->render(
						'TwakeUsersBundle:Mail:recovery_mail.txt.twig',
						$dataMail
					),
					'text/plain'
				)
			;
			$this->get('mailer')->send($message);


		}
		elseif($action == "verifyToken"){
			$user = $manager->getRepository('TwakeUsersBundle:User')->findOneBy(Array('tokenReset'=>$request->request->get('token')));
			if($user==null){
				$data["success"] = false;
			}
			else{
				$now = new \DateTime("now");
				$diff = $now->diff($user->getDateReset());
				$data['diff'] = $diff->d;
				$data['success'] = true;
			}
		}
		elseif($action == "pass"){
			$user = $manager->getRepository('TwakeUsersBundle:User')->findOneBy(Array('tokenReset'=>$request->request->get('token')));
			if($user!=null){
				$factory = $this->get('security.encoder_factory');
				$encoder = $factory->getEncoder($user);
				$user->setPassword($encoder->encodePassword($request->request->get("pass"), $user->getSalt()));
				$user->setTokenReset(null);
				$user->setDateReset(null);
				$manager->persist($user);
				$manager->flush();
				$data['success'] = true;
			}
			else{
				$data['retour'] = "usernotfound";
			}
		}
		else{
			$data['retour'] = "actionnotfound";
		}
		return new JsonResponse($data);
	}

	public function blackHoleAction(){
		throw new NotFoundHttpException();
	}

}