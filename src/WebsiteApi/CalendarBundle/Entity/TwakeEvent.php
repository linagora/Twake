<?php

namespace WebsiteApi\CalendarBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Event
 *
 * @ORM\Table(name="event",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\EventRepository")
 */

class TwakeEvent {

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(name="title", type="string")
     */
    private $title;

    /**
     * @ORM\Column(name="location", type="string")
     */
    private $location;

    /**
     * @ORM\Column(name="description", type="string")
     */
    private $description;

    /**
     * @ORM\Column(name="start_date", type="datetime")
     */
    private $startDate;

    /**
     * @ORM\Column(name="end_date", type="datetime")
     */
    private $endDate;

    /**
     * @ORM\Column(name="color", type="string")
     */
    private $color;

    /**
     * @ORM\OneToMany(targetEntity="WebsiteApi\MarketBundle\Entity\Application", mappedBy="Event")
     * @ORM\JoinColumn(nullable=true)
     */
    private $linkApp;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\CalendarBundle\Entity\Calendar")
     * @ORM\JoinColumn(nullable=true)
     */
    private $calendar;

    public  function __construct($title,$location,$desc,$sDate,$eDate,$color,$cal,$linkApp = null)
    {
        $this->setTitle($title);
        $this->setLocation($location);
        $this->setDescription($desc);
        $this->setStartDate($sDate);
        $this->setEndDate($eDate);
        $this->setColor($color);
        $this->setCalendar($cal);
        $this->setLinkApp($linkApp);
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
    public function getLocation()
    {
        return $this->location;
    }

    /**
     * @param mixed $location
     */
    public function setLocation($location)
    {
        $this->location = $location;
    }

    /**
     * @return mixed
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @param mixed $description
     */
    public function setDescription($description)
    {
        $this->description = $description;
    }

    /**
     * @return mixed
     */
    public function getStartDate()
    {
        return $this->startDate;
    }

    /**
     * @param mixed $startDate
     */
    public function setStartDate($startDate)
    {
        $this->startDate = $startDate;
    }

    /**
     * @return mixed
     */
    public function getEndDate()
    {
        return $this->endDate;
    }

    /**
     * @param mixed $endDate
     */
    public function setEndDate($endDate)
    {
        $this->endDate = $endDate;
    }

    /**
     * @return mixed
     */
    public function getColor()
    {
        return $this->color;
    }

    /**
     * @param mixed $color
     */
    public function setColor($color)
    {
        $this->color = $color;
    }

    /**
     * @return mixed
     */
    public function getLinkApp()
    {
        return $this->linkApp;
    }

    /**
     * @param mixed $linkApp
     */
    public function setLinkApp($linkApp)
    {
        $this->linkApp = $linkApp;
    }

    /**
     * @return mixed
     */
    public function getCalendar()
    {
        return $this->calendar;
    }

    /**
     * @param mixed $linkCalendar
     */
    public function setCalendar(Calendar $calendar)
    {
        $this->calendar = $calendar;
    }


    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "title" => $this->getTitle(),
            "location" => $this->getLocation(),
            "description" => $this->getDescription(),
            "startDate" => $this->getStartDate(),
            "endDate" => $this->getEndDate(),
            "borderColor" => $this->getColor(),
            "textColor" => $this->getColor(),
            "color" => "white",
            "calendar" => $this->getCalendar()->getId(),
        );
    }


}