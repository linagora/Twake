<?php

namespace WebsiteApi\OrganizationsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\OrganizationsBundle\Repository\LinkOrgaUserRepository;

/**
 * OrgaSubscription
 *
 * @ORM\Table(name="orga_subscription",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\OrganizationsBundle\Repository\OrgaSubscriptionRepository")
 */
class OrgaSubscription
{
	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;
	
    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Orga")
     */
	protected $organization;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	protected $user;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date;


    function __construct($organization, $user) {
	    $this->setOrganization($organization);
    	$this->setUser($user);
	    $this->setDate(new \DateTime());
    }

	public function getId() {
		return $this->id;
	}

	public function getOrganization() {
		return $this->organization;
	}

	public function setOrganization($organization) {
		$this->organization = $organization;
	}

	public function getUser() {
		return $this->user;
	}

	public function setUser($user) {
		$this->user = $user;
	}

	public function getDate() {
		return $this->date;
	}

	public function setDate($date) {
		$this->date = $date;
	}
}
