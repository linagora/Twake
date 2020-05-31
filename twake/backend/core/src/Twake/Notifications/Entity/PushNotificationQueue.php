<?php

namespace Twake\Notifications\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="push_queue",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class PushNotificationQueue
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(type="twake_text",  nullable=true)
     */
    private $text;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date;


    public function __construct($text)
    {
        $this->date = new \DateTime();
        $this->text = json_encode($text);
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
     * @return \DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @return mixed
     */
    public function getText()
    {
        return json_decode($this->text);
    }

    /**
     * @param mixed $text
     */
    public function setText($text)
    {
        $this->text = json_encode($text);
    }


    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "date" => $this->getDate()->getTimestamp(),
            "text" => $this->getText()
        );
    }

}

