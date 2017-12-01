<?php


namespace WebsiteApi\StatusBundle\Services;

use WebsiteApi\OrganizationsBundle\Entity\Orga;

class StatusService
{
	var $doctrine;

	function __construct($doctrine){
		$this->doctrine = $doctrine;
	}


	public function canAccessStatus($user, $statusOwner) {

		if ($user != null && $statusOwner != null) {

			if ($statusOwner instanceof Orga) {
				$linkOrgaUser = $this->doctrine->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findOneBy(Array("User" => $user, "Orga" => $statusOwner));
				return $linkOrgaUser != null && $linkOrgaUser->getStatus() == "A";
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