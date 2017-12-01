<?php

namespace WebsiteApi\OrganizationsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * OrgaParentAccess
 *
 * @ORM\Table(name="orga_parent_access",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\OrganizationsBundle\Repository\LinkOrgaParentRepository")
 */
class OrgaParentAccess
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
	 *
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\LinkOrgaParent")
	 */
	protected $linkOrgaParent;

	/**
	 *
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Level")
	 */
	protected $parentLevel;

	/**
	 * @ORM\Column(type="boolean")
	 */
	protected $parentLevelCanAccessChild;



	public function __constructor() {
	}

	public function getId(){
	    return $this->id;
	}


}
