<?php

namespace WebsiteApi\CalendarBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * linkCalendarGroup
 *
 * @ORM\Table(name="linkCalendarGroup",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\LinkCalendarGroupRepository")
 */

class LinkCalendarGroup{

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
    private $orga;

    /**
     * @ORM\Column(name="calendarright", type="boolean")
     */
    private $calendarRight;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\CalendarBundle\Entity\Calendar")
     */
    private $calendar;

    public  function __construct($group,$calendar,$calendarRight = true)
    {
        $this->setOrga($group);
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
    public function getOrga()
    {
        return $this->orga;
    }

    /**
     * @param mixed $orga
     */
    public function setOrga($orga)
    {
        $this->orga = $orga;
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


    public function getArray(){
        return Array(
            "id" => $this->getId(),
            "orga" => $this->getOrga(),
            "calendar" => $this->getCalendar(),
            "right" => $this->getCalendarRight()
        );
    }


}