<?php

namespace Twake\Workspaces\Entity;


use Doctrine\ORM\Mapping as ORM;


/**
 * WorkspacesActivities
 *
 * @ORM\Table(name="workspace_activity",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class WorkspaceActivity
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     */
    private $workspace;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Users\Entity\User")
     */
    private $user;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Market\Entity\Application")
     */
    private $app;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    /**
     * @ORM\Column(type="string")
     */
    private $title;

    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $objectrepository;

    /**
     * @ORM\Column(type="twake_timeuuid", nullable=true)
     */
    private $objectid = 0;

    public function __construct($workspace, $user, $app, $title, $objectrepository, $objectid)
    {
        $this->workspace = $workspace;
        $this->date_added = new \DateTime();
        $this->user = $user;
        $this->app = $app;
        $this->title = $title;
        $this->objectrepository = $objectrepository;
        $this->objectid = $objectid;
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
    public function getDateAdded()
    {
        return $this->date_added;
    }

    /**
     * @return mixed
     */
    public function getApp()
    {
        return $this->app;
    }

    /**
     * @param mixed $app
     */
    public function setApp($app)
    {
        $this->app = $app;
    }

    /**
     * @return mixed
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * @param mixed $title
     */
    public function setTitle($title)
    {
        $this->title = $title;
    }

    /**
     * @return mixed
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @param mixed $user
     */
    public function setUser($user)
    {
        $this->user = $user;
    }


    /**
     * @return mixed
     */
    public function getObjectId()
    {
        return $this->objectid;
    }

    /**
     * @param mixed $objectid
     */
    public function setObjectId($objectid)
    {
        $this->objectid = $objectid;
    }

    /**
     * @return mixed
     */
    public function getObjectRepository()
    {
        return $this->objectrepository;
    }

}
