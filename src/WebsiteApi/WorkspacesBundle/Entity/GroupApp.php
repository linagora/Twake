<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * GroupApp
 *
 * @ORM\Table(name="group_app",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupAppRepository")
 */
class GroupApp
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	private $group;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
	 */
	private $app;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;

	public function __construct($group, $app) {
		$this->group = $group;
		$this->app = $app;
		$this->date_added = new \DateTime();
	}

	/**
	 * @return int
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getGroup()
	{
		return $this->group;
	}

	/**
	 * @return mixed
	 */
	public function getApp()
	{
		return $this->app;
	}

	/**
	 * @return mixed
	 */
	public function getDateAdded()
	{
		return $this->date_added;
	}

}
