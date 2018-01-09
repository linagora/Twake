<?php
namespace WebsiteApi\WorkspacesBundle\Services;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

class Access
{

	private $connected = 0;
	var $doctrine;
	var $tokenStorage;
	var $authorizationChecker;

	public function __construct($doctrine, TokenStorage $tokenStorage, AuthorizationCheckerInterface $authorizationChecker)
	{
		$this->doctrine = $doctrine;
		$this->tokenStorage = $tokenStorage;
		$this->authorizationChecker = $authorizationChecker;
	}

	public function getRightsPossible($workspace)
	{

		$possibleRights = Array( // à remplacer par la liste des applis de base
			"base" => Array(
				"members" => Array(
					"invite" => true,
					"view" => true,
					"remove" => true,
					"edit" => true,
				),
				"groupe" => Array(
					"view" => true,
					"edit" => true,
					"delete" => true,
				),
				"right" => Array(
					"viewOther" => true,
					"edite" => true
				),
				"links" => Array(
					"view" => true,
					"edit" => true
				),
				"apps" => Array(
					"create" => true,
					"acquire" => true
				),
				"status" => Array(
					"post" => true
				),
				"payments" => Array(
					"view" => true,
					"edit" => true
				)
			)
		);

		foreach ($workspace->getApplications() as $application) {
			$possibleRights[$application->getName()] = $application->getUserRights();
		}

		return $possibleRights;
	}

	public function hasRight($currentuser, $groupe, $rightAsked)
	{


		$repositoryLink = $this->doctrine->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser");
		$repositoryLevel = $this->doctrine->getRepository("TwakeWorkspacesBundle:Level");
		$link = $repositoryLink->findOneBy(Array(
			"User" => $currentuser,
			"Workspace" => $groupe
		));
		if ($link == null) {
			return false;
		} else {
			if ($link->getLevel()->getOwner()) {
				return true;
			} else {
				$rightExploded = explode(':', $rightAsked);
				$level = $link->getLevel();
				$rightArray = $level->getRight();
				if (count($rightArray) > 0) {
					foreach ($rightExploded as $ra) {
						$find = false;
						foreach ($rightArray as $key => $right) {
							if ($key == $ra) {
								$rightArray = $right;
								$find = true;
								break;
							}
						}
						if (!$find) {
							return false;
							break;
						}
					}
					if ($find) {
						return $right;
					}
				}
			}
		}
	}

	public function levelHasRight($level, $groupe, $rightAsked)
	{


		if ($level == null) {
			return false;
		} else {
			if ($level->getOwner()) {
				return true;
			} else {
				$rightExploded = explode(':', $rightAsked);
				$rightArray = $level->getRight();
				if (count($rightArray) > 0) {
					foreach ($rightExploded as $ra) {
						$find = false;
						foreach ($rightArray as $key => $right) {
							if ($key == $ra) {
								$rightArray = $right;
								$find = true;
								break;
							}
						}
						if (!$find) {
							return false;
							break;
						}
					}
					if ($find) {
						return $right;
					}
				}
			}
		}
	}

	public function getRight($currentUser, $groupe)
	{
		$res = Array('errors' => Array(), 'data' => Array(
			'idLevel' => -1,
			'right' => Array(),
			'nameLevel' => ""
		));
		$repositoryLink = $this->doctrine->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser");
		$link = $repositoryLink->findOneBy(Array(
			"User" => $currentUser,
			"Workspace" => $groupe
		));
		if ($link == null) {
			$res["errors"] = Array("userNotInWorkspace");
		} else {
			$level = $link->getLevel();
			if ($level->getOwner()) {
				$res["data"]["right"] = $this->getRightsPossible($groupe);
				$res["data"]["nameLevel"] = $level->getName();
				$res["data"]["idLevel"] = $level->getId();
			} else {
				$res["data"]["right"] = $level->getRight();
				$res["data"]["nameLevel"] = $level->getName();
				$res["data"]["idLevel"] = $level->getId();
			}
		}
		return $res;
	}

	public function workspaceIsFound($workspace)
	{

		$manager = $this->doctrine;
		$securityContext = $this->authorizationChecker;

		if ($workspace == null) {
			return false;
		} else if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED') && $workspace->getPrivacy() != 'P') {
			return false;
		} else {
			$user = $this->tokenStorage->getToken()->getUser();
			$linkWorkspaceUser = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $user, "Workspace" => $workspace));

			if ($workspace->getPrivacy() != 'P' && $linkWorkspaceUser == null) {
				return false;
			}
		}

		return true;
	}

	public function quickLevel($groupe)
	{
		$res = Array();
		$repositoryLevel = $this->doctrine->getRepository("TwakeWorkspacesBundle:Level");
		$levels = $repositoryLevel->findBy(Array(
			"groupe" => $groupe
		));
		foreach ($levels as $level) {
			$res[$level->getId()] = $level->getName();
		}
		return $res;
	}

	public function errorsAccess($user, $group, $right)
	{
		$user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($user);
		$group = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$group,"isDeleted"=>false));
		if (!$this->authorizationChecker->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			return ["notconnected"];
		} else if ($group == null) {
			return ["groupnotfound"];
		} else if (!$this->hasRight($user, $group, $right)) {
			return ["notallowed"];
		}
		return [];
	}

}

?>
