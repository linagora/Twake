<?php


namespace WebsiteApi\StatusBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\Workspace;

class StatusService
{
	var $doctrine;

	function __construct($doctrine){
		$this->doctrine = $doctrine;
	}


	public function canAccessStatus($user, $statusOwner) {

		if ($user != null && $statusOwner != null) {

			if ($statusOwner instanceof Workspace) {
				$linkWorkspaceUser = $this->doctrine->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $user, "Workspace" => $statusOwner));
				return $linkWorkspaceUser != null && $linkWorkspaceUser->getStatus() == "A";
			}
			else {
				$contactLink = $this->doctrine->getRepository('TwakeUsersBundle:Contact')->findOneBy(Array("userA" => $user, "userB" => $statusOwner));
				if ($contactLink == null) {
					$contactLink = $this->doctrine->getRepository('TwakeUsersBundle:Contact')->findOneBy(Array("userA" => $statusOwner, "userB" => $user));
				}

				return $user == $statusOwner || $contactLink != null;
			}
		}

		return false;
	}
}