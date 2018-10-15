<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\ObjectLinksBundle\Model\ObjectLinksInterface;

/**
 * Subject
 *
 * @ORM\Table(name="subject",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\SubjectRepository")
 */
class Subject implements ObjectLinksInterface
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
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $firstMessage;

    /**
     * @ORM\Column(type="string")
     */
    private $description;


    public function __construct($name,$stream,$dateCreate,$dateUpdate,$description,$user)
    {
        $this->setName($name);
        $this->setStream($stream);
        $this->setDateCreate($dateCreate);
        $this->setDateUpdate($dateUpdate);
        $this->setUserOpen($user);
        $this->setDescription($description);
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



    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "name" => $this->getName(),
            "dateCreate" => ($this->getDateCreate()?$this->getDateCreate()->getTimestamp():null),
            "dateUpdate" => ($this->getDateUpdate()?$this->getDateUpdate()->getTimestamp():null),
            "stream" => $this->getStream()->getId(),
            "isOpen" => $this->getisOpen(),
            "firstMessage" => ($this->getFirstMessage()!=null)?$this->getFirstMessage()->getId():null,
            "userOpen" => ($this->getUserOpen()!=null)?$this->getUserOpen()->getId():null,
            "description" => $this->getDescription(),
        );
    }
    public function getRepository(){
        return "TwakeDiscussionBundle:Subject";
    }

    public function getAsArrayFormated(){
        return Array(
            "id" => $this->getId(),
            "title" => "Subject",
            "object_name" => $this->getName(),
            "key" => "messages",
            "type" => "subject",
            "code" => "",//TODO
        );
    }


    public function synchroniseField($fieldName, $value)
    {
        if(!property_exists($this, $fieldName))
            return false;

        $setter = "set".ucfirst($fieldName);
        $this->$setter($value);

        return true;
    }

    public function get($fieldName){
        if(!property_exists($this, $fieldName))
            return false;

        $getter = "get".ucfirst($fieldName);

        return $this->$getter();
    }

    public function getPushRoute()
    {
        return "discussion/".$this->getId();
    }

    public function finishSynchroniseField($data)
    {
        // TODO: Implement finishSynchroniseField($data) method.
    }
}
