<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * GroupManager
 *
 * @ORM\Table(name="group_manager",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupManagerRepository")
 */
class GroupManager
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	protected $user;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	protected $group;

	public function __constructor($group, $user) {
		$this->group = $group;
		$this->user = $user;
	}

	public function getId(){
		return $this->id;
	}

}
