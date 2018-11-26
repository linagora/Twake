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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

    /**
     * @ORM\Column(type="text", options={"index": true})
     */
    protected $app_group_id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	private $group;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
	 */
	private $app;

	/**
     * @ORM\Column(type="cassandra_datetime")
	 */
	private $date_added;

    /**
     * @ORM\Column(type="cassandra_boolean")
     */
    private $workspaceDefault;


	public function __construct($group, $app) {
		$this->group = $group;
		$this->app = $app;

        $this->app_group_id = $app->getId() . "_" . $group->getId();

		$this->date_added = new \DateTime();
		$this->workspaceDefault = false;
	}


    public function getAsArray(){
	    return Array(
	        "id" => $this->getId(),
            "group" => $this->getGroup(),
            "app" => $this->getApp(),
            "date_added" => $this->getDateAdded(),
            "workspace_default" => $this->getWorkspaceDefault()
        );
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

    /**
     * @return mixed
     */
    public function getWorkspaceDefault()
    {
        return $this->workspaceDefault;
    }

    /**
     * @param mixed $workspaceDefault
     */
    public function setWorkspaceDefault($workspaceDefault)
    {
        $this->workspaceDefault = $workspaceDefault;
    }

}
