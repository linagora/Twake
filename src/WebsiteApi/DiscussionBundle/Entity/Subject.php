<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Subject
 *
 * @ORM\Table(name="subject",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\SubjectRepository")
 */
class Subject
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Stream")
     */
    private $stream;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;


    /**
     * @ORM\Column(type="datetime")
     */
    private $dateCreate;

    /**
     * @ORM\Column(type="datetime")
     */
    private $dateUpdate;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isOpen = true;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $userOpen;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message")
     */
    private $firstMessage;

    public function __construct($name,$stream,$dateCreate,$dateUpdate,$user)
    {
        $this->setName($name);
        $this->setStream($stream);
        $this->setDateCreate($dateCreate);
        $this->setDateUpdate($dateUpdate);
        $this->setUserOpen($user);
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getStream()
    {
        return $this->stream;
    }

    /**
     * @param mixed $stream
     */
    public function setStream($stream)
    {
        $this->stream = $stream;
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return mixed
     */
    public function getDateCreate()
    {
        return $this->dateCreate;
    }

    /**
     * @param mixed $dateCreate
     */
    public function setDateCreate($dateCreate)
    {
        $this->dateCreate = $dateCreate;
    }

    /**
     * @return mixed
     */
    public function getDateUpdate()
    {
        return $this->dateUpdate;
    }

    /**
     * @param mixed $dateUpdate
     */
    public function setDateUpdate($dateUpdate)
    {
        $this->dateUpdate = $dateUpdate;
    }

    /**
     * @return mixed
     */
    public function getisOpen()
    {
        return $this->isOpen;
    }

    /**
     * @param mixed $isOpen
     */
    public function setIsOpen($isOpen)
    {
        $this->isOpen = $isOpen;
    }

    /**
     * @return mixed
     */
    public function getFirstMessage()
    {
        return $this->firstMessage;
    }

    /**
     * @param mixed $firstMessage
     */
    public function setFirstMessage($firstMessage)
    {
        $this->firstMessage = $firstMessage;
    }

    /**
     * @return mixed
     */
    public function getUserOpen()
    {
        return $this->userOpen;
    }

    /**
     * @param mixed $userOpen
     */
    public function setUserOpen($userOpen)
    {
        $this->userOpen = $userOpen;
    }



    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "name" => $this->getName(),
            "dateCreate" => $this->getDateCreate(),
            "dateUpdate" => $this->getDateUpdate(),
            "stream" => $this->getStream()->getId(),
            "isOpen" => $this->getisOpen(),
            "firstMessage" => ($this->getFirstMessage()!=null)?$this->getFirstMessage()->getId():null,
            "userOpen" => ($this->getUserOpen()!=null)?$this->getUserOpen()->getId():null,
        );
    }

}
