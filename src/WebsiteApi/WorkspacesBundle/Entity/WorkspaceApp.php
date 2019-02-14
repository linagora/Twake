<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;




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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupApp")
	 */
	private $groupapp;

	/**
     * @ORM\Column(type="twake_datetime")
	 */
	private $date_added;

	public function __construct($workspace, $groupapp) {
		$this->workspace = $workspace;
		$this->groupapp = $groupapp;
		$this->date_added = new \DateTime();
	}

	/**
	 * @return int
	 */
	public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getWorkspace()
	{
		return $this->workspace;
	}

	/**
	 * @return mixed
	 */
	public function getGroupApp()
	{
		return $this->groupapp;
	}

	/**
	 * @return mixed
	 */
	public function getDateAdded()
	{
		return $this->date_added;
	}

}
