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
        return $userRepository->findOneBy(Array("usernameCanonical" => $username));
	}
    public function searchUsersByUsername($username,$restrictions,$groupId,$workspaceId)
    {
        if($username == "")
            return "empty username";
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $users = $userRepository->findByName($username);

        if($restrictions == "all"){
            return $users;
        }
        $res = [] ;
        if($restrictions == "group"){
            $groupUserRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupUser");

            foreach($users as $user){
                $groupuser = $groupUserRepository->findOneBy(Array("user_group_id" => $user->getId() . "_" . $groupId));
                if ($groupuser) {
                    $res[] = $user;
                }
            }
        }

        if($restrictions == "workspace"){
            $workspaceUsers = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

            foreach($users as $user){
                $workspaceUser = $workspaceUsers->findOneBy(Array("workspace" => $workspaceId, "user" => $user));
                if ($workspaceUser) {
                    $res[] = $user;
                }
            }
        }

        return $res;

    }
	public function ask($current_user, $user)
	{
		$userRepository = $this->em->getRepository("TwakeUsersBundle:User");

		$current_user = $userRepository->find($current_user);
		$user = $userRepository->find($user);

		$link = $this->get($current_user, $user);

		if($current_user->getId()==$user->getId()){
			return false;
		}

		if(!$link){
			$link = new Contact($current_user, $user);
			$this->em->persist($link);
			$this->em->flush();

			$this->notifications->pushNotification(
				null,
				null,
				Array($user->getId()),
				null,
				"contact_request",
				"@".$current_user->getUsername()." want to become your contact.",
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

		$userRepository = $this->em->getRepository("TwakeUsersBundle:User");
		$user = $userRepository->find($user);

		if(!$link || $link->getFrom()->getId()!=$user->getId()){
			return false;
		}

		$this->notifications->pushNotification(
			null,
			null,
			Array($user->getId()),
			null,
			"contact_acceptation",
			"@".$current_user->getUsername()." accepted to become your contact.",
			Array("push", "mail")
		);

		$link->setStatus(1);

		$this->em->persist($link);
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

	public function getAll($current_user, $ignore_notifications = false)
	{
		error_log("test");
		$contactRepository = $this->em->getRepository("TwakeUsersBundle:Contact");

		$links = $contactRepository->findBy(Array("to"=>$current_user, "status"=>1));
		$links = array_merge($links,
			$contactRepository->findBy(Array("from" => $current_user, "status"=>1))
		);

		if(!$ignore_notifications) {
			$this->notifications->readAll(null, null, $current_user, "contact_acceptation");
		}

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

		$this->notifications->readAll(null, null, $current_user, "contact_request");

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