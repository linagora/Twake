<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * WorkspaceApp
 *
 * @ORM\Table(name="workspace_app",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceAppRepository")
 */
class WorkspaceApp
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupApp")
	 */
	private $group_app;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;

	public function __construct($workspace, $group_app) {
		$this->workspace = $workspace;
		$this->group_app = $group_app;
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
		return $this->workspace;
	}

	/**
	 * @return mixed
	 */
	public function getGroupApp()
	{
		return $this->group_app;
	}

	/**
	 * @return mixed
	 */
	public function getDateAdded()
	{
		return $this->date_added;
	}

}
