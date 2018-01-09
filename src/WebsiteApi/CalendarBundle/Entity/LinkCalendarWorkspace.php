<?php

namespace WebsiteApi\CalendarBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * linkCalendarWorkspace
 *
 * @ORM\Table(name="linkCalendarWorkspace",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\LinkCalendarWorkspaceRepository")
 */

class LinkCalendarWorkspace{

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
     * @ORM\Column(name="calendarright", type="boolean")
     */
    private $calendarRight;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\CalendarBundle\Entity\Calendar")
     */
    private $calendar;

    public  function __construct($workspace,$calendar,$calendarRight = true)
    {
        $this->setWorkspace($workspace);
        $this->setCalendar($calendar);
        $this->setCalendarRight($calendarRight);
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
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
        return $this->calendarRight;
    }

    /**
     * @param mixed $right
     */
    public function setCalendarRight($calendarRight)
    {
        $this->calendarRight = $calendarRight;
    }


    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "workspace" => $this->getWorkspace(),
            "calendar" => $this->getCalendar(),
            "right" => $this->getCalendarRight()
        );
    }


}