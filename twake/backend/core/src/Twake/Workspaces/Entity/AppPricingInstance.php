<?php

namespace Twake\Workspaces\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * AppPricingInstance
 *
 * @ORM\Table(name="app_pricing",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class AppPricingInstance
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Workspaces\Entity\Group")
     */
    private $group;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Workspaces\Entity\GroupApp")
     */
    private $groupapp;

    /**
     * @ORM\Column(name="cost_monthly", type="integer")
     */
    protected $costmonthly;

    /**
     * @ORM\Column(name="cost_per_user", type="integer")
     */
    protected $costuser;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $startedat;


    public function __construct($groupapp)
    {
        $this->group = $groupapp->getGroup();
        $this->groupapp = $groupapp;
        $this->costmonthly = $groupapp->getApp()->getPriceMonthly();
        $this->costuser = $groupapp->getApp()->getPriceUser();
        $this->startedat = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getGroupapp()
    {
        return $this->groupapp;
    }

    /**
     * @param mixed $groupapp
     */
    public function setGroupapp($groupapp)
    {
        $this->groupapp = $groupapp;
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
    public function getCostMonthly()
    {
        return $this->costmonthly;
    }

    /**
     * @param mixed $costmonthly
     */
    public function setCostMonthly($costmonthly)
    {
        $this->costmonthly = $costmonthly;
    }

    /**
     * @return mixed
     */
    public function getCostUser()
    {
        return $this->costuser;
    }

    /**
     * @param mixed $costuser
     */
    public function setCostUser($costuser)
    {
        $this->costuser = $costuser;
    }

    /**
     * @return mixed
     */
    public function getStartedAt()
    {
        return $this->startedat;
    }

    /**
     * @param mixed $startedat
     */
    public function setStartedAt($startedat)
    {
        $this->startedat = $startedat;
    }

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->group;
    }

    /**
     * @param mixed $group
     */
    public function setGroup($group)
    {
        $this->group = $group;
    }

}
