<?php

namespace WebsiteApi\_old_CalendarBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * linkCalendarWorkspace
 *
 * @ORM\Table(name="link_calendar_workspace",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\LinkCalendarWorkspaceRepository")
 */
class LinkCalendarWorkspace
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(type="text", options={"index": true})
     */
    protected $calendar_workspace_id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
    private $workspace;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
     * @ORM\JoinColumn(nullable=true)
     */
    private $application = null;

    /**
     * @ORM\Column(name="calendarright", type="twake_boolean")
     */
    private $calendarright;

    /**
     * @ORM\Column(name="owner", type="twake_boolean")
     */
    private $owner;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\CalendarBundle\Entity\Calendar")
     */
    private $calendar;

    public function __construct($workspace, $calendar, $owner, $calendarright = true)
    {
        $this->setWorkspace($workspace);
        $this->setCalendar($calendar);

        $this->calendar_workspace_id = $this->getCalendar()->getId() . "_" . $this->getWorkspace()->getId();

        $this->setOwner($owner);
        $this->setCalendarRight($calendarright);
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
     * @param mixed $workspace
     */
    public function setWorkspace($workspace)
    {
        $this->workspace = $workspace;
    }

    /**
     * @return mixed
     */
    public function getCalendar()
    {
        return $this->calendar;
    }

    /**
     * @param mixed $calendar
     */
    public function setCalendar($calendar)
    {
        $this->calendar = $calendar;
    }

    /**
     * @return mixed
     */
    public function getCalendarRight()
    {
        return $this->calendarright;
    }

    /**
     * @param mixed $right
     */
    public function setCalendarRight($calendarright)
    {
        $this->calendarright = $calendarright;
    }

    /**
     * @return mixed
     */
    public function getOwner()
    {
        return $this->owner;
    }

    /**
     * @param mixed $owner
     */
    public function setOwner($owner)
    {
        $this->owner = $owner;
    }

    /**
     * @return mixed
     */
    public function getApplication()
    {
        return $this->application;
    }

    /**
     * @param mixed $application
     */
    public function setApplication($application)
    {
        $this->application = $application;
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "workspace" => $this->getWorkspace(),
            "calendar" => $this->getCalendar(),
            "owner" => $this->getOwner(),
            "right" => $this->getCalendarRight(),
            "application" => $this->getApplication()
        );
    }


}