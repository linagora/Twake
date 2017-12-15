<?php


namespace WebsiteApi\UsersBundle\Services;

use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\UsersBundle\Entity\Contact;
use WebsiteApi\UsersBundle\Entity\Mail;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\UsersBundle\Services\Notifications;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use Symfony\Bundle\FrameworkBundle\Templating\EngineInterface;
use \Swift_Mailer;

/**
 * Manage contacts
 */
class Contacts
{

	var $string_cleaner;
	var $doctrine;
	var $security;
	var $notifications;
	var $templating;
	var $mailer;


	/* Configuration */
	var $contacts_mailfrom = "twake@proxima.fr";
	var $contacts_mailsubject = "Invitation de Twake";

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker,Notifications $notifications, EngineInterface $templating, Swift_Mailer $mailer, $server_name){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
		$this->notifications = $notifications;
		$this->templating = $templating;
		$this->mailer = $mailer;
		$this->server_name = $server_name;
	}


	/**
	 * Accept a request, user_id is passed in POST
	 * Can only accept a request where we're not the sender of the request
	 *
	 * @param $request
	 * @return JsonResponse
	 */
	public function accept($user, $idUserA){
		$res = array('status'=>"error",'errors'=>Array());

		$repository = $this->doctrine->getRepository("TwakeUsersBundle:Contact");
		$req = $repository->createQueryBuilder('C')
			->where('IDENTITY(C.userB) = '.$user->getId())
			->andWhere('IDENTITY(C.userA) = '.$idUserA)
			->andWhere("C.status = 'W'")
			->getQuery()->getResult();

		if(count($req)<1){
			$res['errors'][] = "no_such_relation_to_accept";
			return $res;
		}

		$relation = $req[0];

		$relation->accept();
		$this->doctrine->persist($relation);
		$this->doctrine->flush();

		//Send a notification to the user
		//TODO actually it crash the server...
		$this->notifications->sendUpdateNotif(Array($user->getId(), $idUserA), "updateContacts");

		$res['status'] = "success";

		return $res;
	}

	/**
	 * @param $request
	 * @return JsonResponse
	 *
	 * Any user at any time can remove any of its relations, user_id is passed in POST
	 *
	 */
	public function remove($current_user, $idUserA){
		$res = array('status'=>"error",'errors'=>Array());
		
		$this->doctrine->createQueryBuilder()
			->delete("TwakeUsersBundle:Contact", "C")
			->where('(IDENTITY(C.userB) = '.$current_user->getId()
				.' AND '
				.'IDENTITY(C.userA) = '.$idUserA . ')'
			)
			->orWhere('(IDENTITY(C.userA) = '.$current_user->getId()
				.' AND '
				.'IDENTITY(C.userB) = '.$idUserA . ')'
			)
			->getQuery()->execute();

		$res['status'] = "success";

    //Send a notification to the user
    $this->notifications->sendUpdateNotif(Array($current_user->getId(), $idUserA), "updateContacts");
		return $res;
	}

	/**
	 * @param $request
	 * @return JsonResponse
	 *
	 * Ask for new relation, user_id is passed in POST
	 *
	 * An user cannot be friend of itself
	 * if the relation exists, may be its waiting an acceptation so the function returns the result of accept in this case
	 *
	 */
	public function ask($current_user, $idUserB){
		$res = array('status'=>"error",'errors'=>Array());

		if($idUserB==$current_user->getId()){
			$res['errors'][] = "can_be_friend_to_yourself";
			return $res;
		}

		$repository = $this->doctrine->getRepository("TwakeUsersBundle:Contact");
		$req = $repository->createQueryBuilder('C')
			->where('(IDENTITY(C.userB) = '.$current_user->getId()
				.' AND '
				.'IDENTITY(C.userA) = '.$idUserB . ')'
			)
			->orWhere('(IDENTITY(C.userA) = '.$current_user->getId()
				.' AND '
				.'IDENTITY(C.userB) = '.$idUserB . ')'
			)
			->getQuery()->getResult();

		if(count($req)>0){
			//If relation exists, try to accept it
			return $this->accept($current_user, $idUserB);
		}else{

			$userB = $this->doctrine->find("TwakeUsersBundle:User",$idUserB);

			if($userB==null){
				$res['errors'][] = "no_such_userB";
				return  $res;
			}

			$relation = new Contact;
			$relation->link($current_user, $userB);

			$this->doctrine->persist($relation);
			$this->doctrine->flush();

			//Send a notification to the user
			$userimage = "";
			if($current_user->getThumbnail()!=null) {
				$userimage = $this->server_name . $current_user->getThumbnail()->getPublicURL(2);
			}
			$this->notifications->push(
				$userB,
				$current_user,
				"friend_request",
		        ["classic","fast"],
		        Array(
		          "title"=>"Demande d'ami",
		          "text"=>$current_user->getUsername()." vous a demandé en ami !",
		          "url"=>"user/".$current_user->getUsernameClean(),
		        )
			);

		}

		$res['status'] = "success";

		return $res;
	}

	/**
	 * @param $request
	 * @return JsonResponse
	 *
	 * Ask for new relation, user_id is passed in POST
	 *
	 * An user cannot be friend of itself
	 * if the relation exists, may be its waiting an acceptation so the function returns the result of accept in this case
	 *
	 */
	public function askByMail($current_user, $mail){
		$res = array('status'=>"error",'errors'=>Array());

		$uid = $current_user->getId();

		$repository = $this->doctrine->getRepository("TwakeUsersBundle:Contact");
		$req = $repository->createQueryBuilder('C')
			->where("(C.userBmail = '$mail'"
				.' AND '
				.'IDENTITY(C.userA) = '.$uid . ')'
			)
			->getQuery()->getResult();

		if(count($req)>0){
			//Already asked
			$res["errors"][] = "already_asked";
			return $res;
		}else{

			//Créer le contact
			$relation = new Contact;
			$relation->linkMail($current_user, $mail);

			$repoMail = $this->doctrine->getRepository("TwakeUsersBundle:Mail");
			$second_mail = $repoMail->findOneBy(Array("mail"=>$mail));
			if($second_mail==null) {
				//Ajouter le mail à la liste des mails secondaires en attente (au cas ou l'utilisateur pointé serait déjà inscrit avec une autre adresse)
				$second_mail = new Mail;
				$second_mail->setMail($mail);
				$second_mail->newToken();
			}

			$verification_token = $second_mail->getToken();


			$data = Array(
				"user" => $current_user,
				"mail" => $mail,
				"token" => $verification_token
			);

			//Sending verification mail
			$message = \Swift_Message::newInstance()
				->setSubject($this->contacts_mailsubject)
				->setFrom($this->contacts_mailfrom)
				->setTo($mail)
				->setBody(
					$this->templating->render(
						'TwakeUsersBundle:Mail:invite_by_mail.html.twig',
						$data
					),
					'text/html'
				)
				->addPart(
					$this->templating->render(
						'TwakeUsersBundle:Mail:invite_by_mail.txt.twig',
						$data
					),
					'text/plain'
				)
			;
			$this->mailer->send($message);


			$this->doctrine->persist($second_mail);
			$this->doctrine->persist($relation);
			$this->doctrine->flush();

			$res["status"] = "success";
		}

		return $res;
	}

	/**
	 * Retourne la relation vis ) vis d'un utilisateur
	 *
	 * @param $request
	 * @return JsonResponse
	 */
	function getRelation($current_user, $idUser){

		$res = array('status'=>"success");
		if ($current_user->getId() == $idUser){
		    $res['status'] = "error";
		    $res['errors'] = Array('cant_friend_yourself');
		    return $res;
        }

		$repository = $this->doctrine->getRepository("TwakeUsersBundle:Contact");
		$req = $repository->createQueryBuilder('C')
			->where('(IDENTITY(C.userB) = '.$current_user->getId()
				.' AND '
				.'IDENTITY(C.userA) = '.$idUser . ')'
			)
			->orWhere('(IDENTITY(C.userA) = '.$current_user->getId()
				.' AND '
				.'IDENTITY(C.userB) = '.$idUser . ')'
			)
			->getQuery()->getResult();

		if(count($req)<1){

			$the_user = $this->doctrine->find("TwakeUsersBundle:User",$idUser);
			if($the_user==null){
				$res['status'] = "error";
				$res['errors'] = Array('no_such_user');
				return $res;
			}

			$res['result'] = "canask";

			return $res;
		}

		$req = $req[0];

		if($req->getStatus()=="W" and $req->getUserA()->getId()==$current_user->getId()){
			$res['result'] = "cancel";
			return $res;
		}

		if($req->getStatus()=="W" and $req->getUserB()->getId()==$current_user->getId()){
			$res['result'] = "accept";
			return $res;
		}

		if($req->getStatus()=="A"){
			$res['result'] = "remove";
			return $res;
		}

		$res['status'] = "error";
		return $res;

	}

	/**
	 * Retourne la liste complète des contacts
	 * @param $request
	 */
	function getAllContacts($current_user){

		$res = array('status'=>"success", "results"=>Array());

		$repository = $this->doctrine->getRepository("TwakeUsersBundle:Contact");
		$req = $repository->createQueryBuilder('C')
			->where('IDENTITY(C.userB) = '.$current_user->getId())
			->orWhere('IDENTITY(C.userA) = '.$current_user->getId())
			->orderBy('C.lastMessageDate', 'desc')
			->getQuery()->getResult();

		$connected = Array();
		$notconnected = Array();

		foreach($req as $rel){
			$otherUser = ($current_user->getId()==$rel->getUserA()->getId())?$rel->getUserB():$rel->getUserA();

			//Si je n'attends pas la réponse de l'autre personne
			if(!($current_user->getId()==$rel->getUserA()->getId() and $rel->getStatus()=="W")) {
				$data = $otherUser->getAsSimpleArray();
				$data["status"] = $rel->getStatus();

				if($otherUser->isConnected()) {
					$connected[] = $data;
				}else{
					$notconnected[] = $data;
				}
			}
		}

		$res['results'] = array_merge($connected, $notconnected);

		return $res;

	}


	/**
	 * If an user $user just linked a new mail $mail to his account, this function can delete friends request done by mail and replace them by a classic request.
	 * @param $user
	 * @param $mail
	 */
	function checkRequestAskedByMail($user, $mail){

		$repository = $this->doctrine->getRepository("TwakeUsersBundle:Contact");
		$req = $repository->createQueryBuilder('C')
			->where("C.userBmail = '$mail'")
			->getQuery()->getResult();

		foreach ($req as $request) {

			$this->ask($request->getUserA(),$user->getId()); //Re-ask with new known user ID

		}

		$this->doctrine->createQueryBuilder('C')
			->delete("TwakeUsersBundle:Contact", "C")
			->where("C.userBmail = '$mail'")
			->getQuery()->getResult();

		return true;

	}


	/**
	 * Ajouter l'utilisateurs dans les groupes qui l'attendait
	 * @param $user
	 * @param $mail
	 * @return bool
	 */
	function checkGroupRequestAskedByMail($user, $mail){

		$manager = $this->doctrine;

		$repository = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser");
		$req = $repository->findBy(Array("mail"=>$mail));

		foreach ($req as $request) {

			$request->setStatus("P");//WAITING FOR acceptation
			$request->setUser($user);
			$request->setMail("");
			$manager->persist($request);

			$this->notifications->push(
				$user,
				null,
				"group_invitation",
				["classic", "fast"],
				Array(
					"title" => "Invitation au groupe " . $request->getGroup()->getName(),
					"url" => "account/groups",
					"text" => ""
				)
			);

		}

		$manager->flush();

		return true;

	}


}