<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * WorkspaceParentAccess
 *
 * @ORM\Table(name="workspace_parent_access",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\LinkWorkspaceParentRepository")
 */
class WorkspaceParentAccess
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent")
	 */
	protected $linkWorkspaceParent;

	/**
	 *
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Level")
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
