<?php

namespace WebsiteApi\UsersBundle\Services;

use WebsiteApi\UsersBundle\Entity\Contact;
use WebsiteApi\UsersBundle\Model\ContactsInterface;

class Contacts implements ContactsInterface
{

	private $em;
	private $notifications;

	public function __construct($em, $notifications){
		$this->em = $em;
		$this->notifications = $notifications;
	}

	public function searchByUsername($username)
	{
		$userRepository = $this->em->getRepository("TwakeUsersBundle:User");
		return $userRepository->findOneBy(Array("username"=>$username));
	}

	public function ask($current_user, $user)
	{
		$userRepository = $this->em->getRepository("TwakeUsersBundle:User");

		$current_user = $userRepository->find($current_user);
		$user = $userRepository->find($user);

		$link = $this->get($current_user, $user);

		if(!$link){
			$link = new Contact($current_user, $user);
			$this->em->persist($link);
			$this->em->flush();

			$this->notifications->pushNotification(
				null,
				null,
				Array(),
				null,
				"contact_request",
				"@".$user->getUsername()." want to become your contact.",
				Array("push", "mail")
			);

			return true;
		}

		if($link->getFrom()->getId() == $user->getId()){
			return $this->accept($current_user, $user);
		}

		return false;
	}

	public function remove($current_user, $user)
	{
		$link = $this->get($current_user, $user);

		if(!$link){
			return false;
		}

		$this->em->remove($link);
		$this->em->flush();

		return true;
	}

	public function accept($current_user, $user)
	{
		$link = $this->get($current_user, $user);

		$link->setStatus(1);

		$this->em->remove($link);
		$this->em->flush();

		return true;
	}

	public function get($current_user, $user)
	{
		$contactRepository = $this->em->getRepository("TwakeUsersBundle:Contact");

		$link = $contactRepository->findOneBy(Array("from"=>$user,"to"=>$current_user));
		if(!$link) {
			$link = $contactRepository->findOneBy(Array("from" => $current_user, "to" => $user));
		}

		return $link;
	}

	public function getAll($current_user)
	{
		$contactRepository = $this->em->getRepository("TwakeUsersBundle:Contact");

		$links = $contactRepository->findBy(Array("to"=>$current_user, "status"=>1));
		$links = array_merge($links,
			$contactRepository->findBy(Array("from" => $current_user, "status"=>1))
		);

		$userRepository = $this->em->getRepository("TwakeUsersBundle:User");
		$current_user = $userRepository->find($current_user);

		$list = [];
		foreach($links as $link){
			if($link->getFrom()->getId()==$current_user->getId()){
				$list[] = $link->getTo();
			}else{
				$list[] = $link->getFrom();
			}
		}

		return $list;
	}

	public function getAllRequests($current_user)
	{
		$contactRepository = $this->em->getRepository("TwakeUsersBundle:Contact");

		$links = $contactRepository->findBy(Array("to"=>$current_user, "status"=>0));

		$userRepository = $this->em->getRepository("TwakeUsersBundle:User");
		$current_user = $userRepository->find($current_user);

		$list = [];
		foreach($links as $link){
			if($link->getFrom()->getId()==$current_user->getId()){
				$list[] = $link->getTo();
			}else{
				$list[] = $link->getFrom();
			}
		}

		return $list;
	}

	public function getAllRequestsFromMe($current_user)
	{
		$contactRepository = $this->em->getRepository("TwakeUsersBundle:Contact");

		$links = $contactRepository->findBy(Array("from"=>$current_user, "status"=>0));

		$userRepository = $this->em->getRepository("TwakeUsersBundle:User");
		$current_user = $userRepository->find($current_user);

		$list = [];
		foreach($links as $link){
			if($link->getFrom()->getId()==$current_user->getId()){
				$list[] = $link->getTo();
			}else{
				$list[] = $link->getFrom();
			}
		}

		return $list;
	}
}