<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
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
     * @ORM\Column(type="cassandra_datetime")
     */
    private $datecreate;

    /**
     * @ORM\Column(type="cassandra_datetime")
     */
    private $dateupdate;

    /**
     * @ORM\Column(type="cassandra_boolean")
     */
    private $isopen = true;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $useropen;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $firstmessage;

    /**
     * @ORM\Column(type="string")
     */
    private $description;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $object_link_cache;


    public function __construct($name, $stream, $datecreate, $dateupdate, $description, $user)
    {
        $this->setName($name);
        $this->setStream($stream);
        $this->setDateCreate($datecreate);
        $this->setDateUpdate($dateupdate);
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
        return $this->datecreate;
    }

    /**
     * @param mixed $datecreate
     */
    public function setDateCreate($datecreate)
    {
        $this->datecreate = $datecreate;
    }

    /**
     * @return mixed
     */
    public function getDateUpdate()
    {
        return $this->dateupdate;
    }

    /**
     * @param mixed $dateupdate
     */
    public function setDateUpdate($dateupdate)
    {
        $this->dateupdate = $dateupdate;
    }

    /**
     * @return mixed
     */
    public function getisOpen()
    {
        return $this->isopen;
    }

    /**
     * @param mixed $isopen
     */
    public function setIsOpen($isopen)
    {
        $this->isopen = $isopen;
    }

    /**
     * @return mixed
     */
    public function getFirstMessage()
    {
        return $this->firstmessage;
    }

    /**
     * @param mixed $firstmessage
     */
    public function setFirstMessage($firstmessage)
    {
        $this->firstmessage = $firstmessage;
    }

    /**
     * @return mixed
     */
    public function getUserOpen()
    {
        return $this->useropen;
    }

    /**
     * @param mixed $useropen
     */
    public function setUserOpen($useropen)
    {
        $this->useropen = $useropen;
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
            "object_link_cache" => $this->getObjectLinkCache()
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


    public function synchroniseField($fieldname, $value)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $setter = "set" . ucfirst($fieldname);
        $this->$setter($value);

        return true;
    }

    public function get($fieldname)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $getter = "get" . ucfirst($fieldname);

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

    public function setObjectLinkCache($cache)
    {
        $this->object_link_cache = json_encode($cache);
    }

    public function getObjectLinkCache()
    {
        return json_decode($this->object_link_cache, 1);
    }

}
