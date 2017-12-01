<?php

namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\UsersBundle\Entity\Mail;

class AccountParametersController extends Controller
{
	var $parameters_mailfrom = "Twake@Twake.fr";

	/**
	 * Parameters pages
	 */
	public function getParametersAction(){
		$response = Array("errors" => Array(), "data"=>Array());
		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$response['errors'][] = "not connected";
			return $response;
		}

		$em = $this->getDoctrine()->getManager();
		$user = $this->getUser();
		$mail = $user->getEmail();
		$secondarylist = $user->getSecondaryMails();
		$secondary = Array();
		foreach($secondarylist as $sec){
		  $secondary[] = Array("mail" => $sec->getMail(),
													 "id" => $sec->getId(),
												   "token" => $sec->getToken());
		}
		$name = $user->getUsername();
		$response["data"] = Array("email"=>$mail,
															"username"=>$name,
															"secondary"=>$secondary
														);
		return new JsonResponse($response);
	}

	public function parametersPagesAction($page){
		if($page=="managepseudo") {
			return $this->render('TwakeUsersBundle:Account:popup/pseudo.html.twig');
		}
		if($page=="managemails") {
			return $this->render('TwakeUsersBundle:Account:popup/addmail.html.twig');
		}
		if($page=="managepassword") {
			return $this->render('TwakeUsersBundle:Account:popup/password.html.twig');
		}
	}

	public function scriptAction(Request $request){

		$manager = $this->getDoctrine()->getManager();

		$user = $this->getUser();

		$errors = array();
		$ok = true;

		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data = Array(
				"errors" => Array(),
				"data" => Array()
			);
			$data["errors"][] = "notconnected";
			return $data;
		}

		/**
		 * Change pseudo
		 */
		if($request->request->get("source", '')=="pseudo") {

			$this->saveUsername($ok, $errors, $user, $request->request->get("pseudo", ''));
			if ($ok) {
				$manager->persist($user);
				$manager->flush();
			}
		}

		/**
		 * Delete secondary mail
		 */
		if($request->request->get("source", '')=="deletemail") {
			$mid = $request->request->getInt("mid");
			$uid = $user->getId();
			$manager->createQueryBuilder('o')
				->delete("TwakeUsersBundle:Mail", "M")
				->where("IDENTITY(M.user) = $uid")
				->andWhere("M.id = $mid")
				->getQuery()
				->getResult();
		}

		/**
		 * Set mail as primary mail
		 */
		if($request->request->get("source", '')=="changemail") {
			$mid = $request->request->getInt("mid");
			$uid = $user->getId();
			$repository = $manager->getRepository("TwakeUsersBundle:Mail");
			$req = $repository->createQueryBuilder('M')
				->where("IDENTITY(M.user) = $uid")
				->andWhere("M.id = $mid")
				->andWhere("M.token IS NULL")
				->getQuery()
				->getResult();
			if(count($req)<=0){
				$ok = false;
				$errors = "secondaryMailIsntFound";
			}else{
				$req = $req[0];
				$newMainMail = $req->getMail();
				$req->setMail($user->getEmail());
				$user->setEmail($newMainMail);
				$manager->persist($req);
				$manager->persist($user);
				$manager->flush();
			}

		}

		/**
		 * Add mail
		 */
		$new_id = -1;
		if($request->request->get("source", '')=="addmail") {

			$new_id = $this->addMail($ok, $errors, $user, $manager, $request->request->get("mail", ''));

		}

		/**
		 * Change password
		 */
		if($request->request->get("source", '')=="changepassword") {
			$this->savePassword($ok, $errors, $user,
				$request->request->get("current_password", ''),
				$request->request->get("new_password", ''),
				$request->request->get("new_password_verify", '')
			);
			if ($ok) {
				$manager->persist($user);
				$manager->flush();
			}
		}

		return new JsonResponse(array(
			'status' => ($ok ? 'success' : 'error'),
			'errors' => $errors,
			'new_id' => $new_id
		));

	}




	public function addMail(&$ok, &$errors, $user, $manager, $mail){


		if (!$this->get('app.string_cleaner')->verifyMail($mail)){
			$errors[] = 'bad_mail';
			$ok = false;
		}
		else if (
			$manager->getRepository('TwakeUsersBundle:Mail')->findOneBy(array('mail' => $mail,'token' => "")) != null
			or
			$manager->getRepository('TwakeUsersBundle:User')->findOneBy(array('email' => $mail)) != null
		){
			$errors[] = 'mail_already_used';
			$ok = false;
		}else{

			//Delete UNverified mails before
			$manager->createQueryBuilder('o')
				->delete("TwakeUsersBundle:Mail", "M")
				->where("M.mail = '$mail'")
				->andWhere("M.token != ''")
				->getQuery()
				->getResult();


			$mail_e = new Mail();
			$mail_e->setUser($user);
			$mail_e->setMail($mail);
			$mail_e->newToken();

			$verification_token = $mail_e->getToken();

			$data = Array(
				"token" => $verification_token
			);

			//Sending verification mail
			$message = \Swift_Message::newInstance()
				->setSubject("Vérification de votre adresse mail")
				->setFrom($this->parameters_mailfrom)
				->setTo($mail)
				->setBody(
					$this->renderView(
						'TwakeUsersBundle:Mail:verify_second_mail.html.twig',
						$data
					),
					'text/html'
				)
				->addPart(
					$this->renderView(
						'TwakeUsersBundle:Mail:verify_second_mail.txt.twig',
						$data
					),
					'text/plain'
				)
			;
			$this->get('mailer')->send($message);

			$manager->persist($mail_e);
			$manager->flush();
			return $mail_e->getId();
		}
	}

	public function savePassword(&$ok, &$errors, $user, $oldpassword, $newpassword1, $newpassword2) {

		if (isset($oldpassword) && isset($newpassword1)) {
			$factory = $this->get('security.encoder_factory');
			$encoder = $factory->getEncoder($user);

			if (!$encoder->isPasswordValid($user->getPassword(), $oldpassword, $user->getSalt())){
				$errors[] = 'old_password_incorrect';
				$ok = false;
			}
			else if (!$this->get('app.string_cleaner')->verifyPassword($newpassword1)){
				$errors[] = 'new_password_incorrect';
				$ok = false;
			}
			else if ($newpassword1!=$newpassword2){
				$errors[] = 'passwords_differents';
				$ok = false;
			}
			else {
				$user->setPassword($encoder->encodePassword($newpassword1, $user->getSalt()));
			}
		}
	}

	public function saveUsername(&$ok, &$errors, $user, $pseudo) {
		if (isset($pseudo)) {
			$userRepository = $this->getDoctrine()->getRepository('TwakeUsersBundle:User');

			if (!$this->get('app.string_cleaner')->verifyUsername($pseudo)) {
				$errors[] = 'username_too_short';
				$ok = false;
			}
			else if ($pseudo != $user->getUsername() && $userRepository->findOneBy(array('username' => $pseudo))) {
				$errors[] = 'username_already_used';
				$ok = false;
			}
			else {
				$user->setUsername($pseudo);
				$user->setUsernameClean($this->get('app.string_cleaner')->simplify($pseudo));

				//Change username cache in contacts & linkorgauser
				$usernameclean = $user->getUsernameClean();

				$qb = $this->getDoctrine()->getManager()->createQueryBuilder();
				$q = $qb->update('TwakeUsersBundle:Contact', 'c')
					->set('c.usernameAcache', $qb->expr()->literal($usernameclean))
					->where('c.userA = ?1')
					->setParameter(1, $user)
					->getQuery();
				$p = $q->execute();

				$qb = $this->getDoctrine()->getManager()->createQueryBuilder();
				$q = $qb->update('TwakeUsersBundle:Contact', 'c')
					->set('c.usernameBcache', $qb->expr()->literal($usernameclean))
					->where('c.userB = ?1')
					->setParameter(1, $user)
					->getQuery();
				$p = $q->execute();

				$qb = $this->getDoctrine()->getManager()->createQueryBuilder();
				$q = $qb->update('TwakeOrganizationsBundle:LinkOrgaUser', 'o')
					->set('o.usernamecache', $qb->expr()->literal($usernameclean))
					->where('o.User = ?1')
					->setParameter(1, $user)
					->getQuery();
				$p = $q->execute();

			}
		}
	}


}
