<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\GroupManager;
use WebsiteApi\WorkspacesBundle\Model\GroupManagersInterface;

class GroupManagers implements GroupManagersInterface
{

	var $doctrine;
	private $twake_mailer;

	var $privileges = Array(
		0 => Array( "VIEW_USERS",
					"VIEW_WORKSPACES",
					"VIEW_MANAGERS",
					"VIEW_APPS",
					"VIEW_PRICINGS"),
		1 => Array( "VIEW_USERS",
					"VIEW_WORKSPACES",
					"VIEW_MANAGERS",
					"VIEW_APPS",
					"VIEW_PRICINGS",
					"MANAGE_USERS",
					"MANAGE_WORKSPACES"),
		2 => Array( "VIEW_USERS",
					"VIEW_WORKSPACES",
					"VIEW_MANAGERS",
					"VIEW_APPS",
					"VIEW_PRICINGS",
					"MANAGE_USERS",
					"MANAGE_WORKSPACES",
					"MANAGE_MANAGERS",
					"MANAGE_PRICINGS",
					"MANAGE_APPS",
					"MANAGE_DATA")
	);

	public function __construct($doctrine, $twake_mailer)
	{
		$this->doctrine = $doctrine;
		$this->twake_mailer = $twake_mailer;
	}

	public function hasPrivileges($level, $privilege){
		$privileges = $this->getPrivileges($level);
		if($privileges == null){
			return false;
		}
		return in_array($privilege, $privileges);
	}

	public function getPrivileges($level){
		if($level == null){
			return null;
		}
		return $this->privileges[$level];
	}

	public function getLevel($groupId, $userId, $currentUserId = null)
	{

		if($userId == null){
			return 2; // If userId == null this is the system (all rights)
		}

		/*
		 * If currentUserId == null then we are root (system)
		 * If we are the current user we can access our data
		 * Else we verify that we can look rights
		 */
		if($currentUserId == null
			|| $currentUserId == $userId
			|| $this->hasPrivileges(
				$this->getLevel($groupId, $currentUserId, $currentUserId),
				"VIEW_MANAGERS"
			)
		){

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
			$groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupManager");

			$user = $userRepository->find($userId);
			$group = $groupRepository->find($groupId);
			$manager = $groupManagerRepository->findOneBy(Array("user"=>$user, "group"=>$group));

			if(!$manager){
				return null; //No rights
			}

			return $manager->getLevel();

		}

		return null; //No rights

	}

	public function changeLevel($groupId, $userId, $level, $currentUserId = null)
	{
		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
		$groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupManager");

		if($currentUserId == null
			|| $this->hasPrivileges(
				$this->getLevel($groupId, $currentUserId),
				"MANAGE_MANAGERS"
			)
		) {

			$user = $userRepository->find($userId);
			$group = $groupRepository->find($groupId);
			$manager = $groupManagerRepository->findOneBy(Array("user" => $user, "group" => $group));

			if($manager){
				$manager->setLevel($level);
				$this->doctrine->persist($manager);
				$this->doctrine->flush();
				return true;
			}

		}

		return false;

	}

	public function addManager($groupId, $userId, $level, $currentUserId = null)
	{
		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");

		if($currentUserId == null
			|| $this->hasPrivileges(
				$this->getLevel($groupId, $currentUserId),
				"MANAGE_MANAGERS"
			)
		) {

			$user = $userRepository->find($userId);
			$group = $groupRepository->find($groupId);

			$this->removeManager($groupId, $userId);
			$manager = new GroupManager($group, $user);

			$manager->setLevel($level);

			$this->twake_mailer->send($user->getEmail(), "addedToGroupManagersMail", Array("group"=>$group->getDisplayName(), "username"=>$user->getUsername()));

			$this->doctrine->persist($manager);
			$this->doctrine->flush();

			return true;

		}

		return false;
	}

	public function removeManager($groupId, $userId, $currentUserId = null)
	{
		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
		$groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupManager");

		if($currentUserId==$userId){
			return false; //Cant remove myself
		}

		if($currentUserId == null
			|| $this->hasPrivileges(
				$this->getLevel($groupId, $currentUserId),
				"MANAGE_MANAGERS"
			)
		) {

			$user = $userRepository->find($userId);
			$group = $groupRepository->find($groupId);
			$manager = $groupManagerRepository->findOneBy(Array("user" => $user, "group" => $group));

			if(!$manager){
				return true;
			}

			$this->doctrine->remove($manager);
			$this->doctrine->flush();

			return true;

		}

		return false;
	}

	public function getManagers($groupId, $currentUserId = null)
	{

		$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
		$groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupManager");

		if($currentUserId == null
			|| $this->hasPrivileges(
				$this->getLevel($groupId, $currentUserId),
				"VIEW_MANAGERS"
			)
		) {

			$group = $groupRepository->find($groupId);
			$managerLinks = $groupManagerRepository->findBy(Array("group" => $group));

			$users = Array();
			foreach ($managerLinks as $managerLink){
				$users[] = Array(
					"user" => $managerLink->getUser(),
					"level" => $managerLink->getLevel()
				);
			}

			return $users;

		}

		return false;
	}

	public function getGroups($userId)
	{

		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupManager");

		$user = $userRepository->find($userId);
		$groupsLinks = $groupManagerRepository->findBy(Array("user" => $user));

		$groups = Array();
		foreach ($groupsLinks as $groupLink){
			$groups[] = Array(
				"group" => $groupLink->getGroup(),
				"level" => $groupLink->getLevel()
			);
		}

		return $groups;

	}

}