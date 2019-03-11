<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;




/**
 * GroupApp
 *
 * @ORM\Table(name="group_app",options={"engine":"MyISAM", "scylladb_keys": {{"group_id": "ASC", "app_id": "ASC", "id": "ASC"}, {"id":"ASC"}}})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupAppRepository")
 */
class GroupApp
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
     * @ORM\Id
     */
	private $group;

	/**
     * @ORM\Column(name="app_id", type="twake_timeuuid")
     * @ORM\Id
	 */
    private $app_id;

	/**
     * @ORM\Column(type="twake_datetime")
	 */
	private $date_added;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $workspacedefault;

    /**
     * @ORM\Column(type="integer")
     */
    private $workspaces_count;


    public function __construct($group, $app_id)
    {
		$this->group = $group;
        $this->app_id = $app_id;

		$this->date_added = new \DateTime();
        $this->workspacedefault = false;
	}


    public function getAsArray(){
	    return Array(
	        "id" => $this->getId(),
            "group_id" => $this->getGroup()->getId(),
            "app_id" => $this->getAppId(),
            "date_added" => $this->getDateAdded(),
            "workspace_default" => $this->getWorkspaceDefault(),
            "workspace_count" => $this->getWorkspacesCount()
        );
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
	public function getGroup()
	{
		return $this->group;
	}

	/**
	 * @return mixed
	 */
	public function getDateAdded()
	{
		return $this->date_added;
	}

    /**
     * @return mixed
     */
    public function getWorkspaceDefault()
    {
        return $this->workspacedefault;
    }

    /**
     * @param mixed $workspacedefault
     */
    public function setWorkspaceDefault($workspacedefault)
    {
        $this->workspacedefault = $workspacedefault;
    }

    /**
     * @return mixed
     */
    public function getAppId()
    {
        return $this->app_id;
    }

    /**
     * @param mixed $app_id
     */
    public function setAppId($app_id)
    {
        $this->app_id = $app_id;
    }

    /**
     * @return mixed
     */
    public function getWorkspacesCount()
    {
        return $this->workspaces_count;
    }

    /**
     * @param mixed $workspaces_count
     */
    public function setWorkspacesCount($workspaces_count)
    {
        $this->workspaces_count = $workspaces_count;
    }

}
