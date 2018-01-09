<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="message",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\MessageRepository")
 */
class Message
{
	/**
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
	 */
	private $userSender;
	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
	 */
	private $applicationSender;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $userReciever;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Stream",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $streamReciever;

	/**
	 * @ORM\Column(type="string", length=1)
	 */
	private $typeReciever;

	/**
	 * @ORM\Column(type="string", length=1)
	 */
	private $typeSender;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date;

	/**
	 * @ORM\Column(type="text", length=20000)
	 */
	private $content;

	/**
	 * @ORM\Column(type="text", length=10000)
	 */
	private $cleanContent;


	/**
	 * @ORM\Column(type="boolean")
	 */
	private $edited = false;

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $pinned = false;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $responseTo = null;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Subject",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $subject = null;


	public function __construct($typeSender,$sender,$typeReciever,$reciever,$date,$content,$subject){
        $this->setTypeSender($typeSender);
	    if($typeSender == "U"){
            $this->setUserSender($sender);
        }
        elseif($typeSender == "A"){
            $this->setApplicationSender($sender);
        }

        $this->setTypeReciever($typeReciever);
        if($typeReciever == "S"){
            $this->setStreamReciever($reciever);
        }
        elseif($typeReciever == "U"){
            $this->setUserReciever($reciever);
        }
        $this->setDate($date);
        $this->setContent($content);
        $this->setCleanContent($content);
        if($subject != null){
            $this->setSubject($subject);
        }
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
    public function getUserSender()
    {
        return $this->userSender;
    }

    /**
     * @param mixed $userSender
     */
    public function setUserSender($userSender)
    {
        $this->userSender = $userSender;
    }

    /**
     * @return mixed
     */
    public function getApplicationSender()
    {
        return $this->applicationSender;
    }

    /**
     * @param mixed $applicationSender
     */
    public function setApplicationSender($applicationSender)
    {
        $this->applicationSender = $applicationSender;
    }

    /**
     * @return mixed
     */
    public function getUserReciever()
    {
        return $this->userReciever;
    }

    /**
     * @param mixed $userReciever
     */
    public function setUserReciever($userReciever)
    {
        $this->userReciever = $userReciever;
    }

    /**
     * @return mixed
     */
    public function getStreamReciever()
    {
        return $this->streamReciever;
    }

    /**
     * @param mixed $streamReciever
     */
    public function setStreamReciever($streamReciever)
    {
        $this->streamReciever = $streamReciever;
    }

    /**
     * @return mixed
     */
    public function getTypeReciever()
    {
        return $this->typeReciever;
    }

    /**
     * @param mixed $typeReciever
     */
    public function setTypeReciever($typeReciever)
    {
        $this->typeReciever = $typeReciever;
    }

    /**
     * @return mixed
     */
    public function getTypeSender()
    {
        return $this->typeSender;
    }

    /**
     * @param mixed $typeSender
     */
    public function setTypeSender($typeSender)
    {
        $this->typeSender = $typeSender;
    }


    /**
     * @return mixed
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @param mixed $date
     */
    public function setDate($date)
    {
        $this->date = $date;
    }

    /**
     * @return mixed
     */
    public function getCleanContent()
    {
        return $this->cleanContent;
    }

    /**
     * @param mixed $cleanContent
     */
    public function setCleanContent($cleanContent)
    {
        $this->cleanContent =  substr($cleanContent, 0, 10000);
    }

    public function setContent($content)
    {
        $content = substr($content, 0, 10000);
        $this->content = base64_encode($content);
    }

    public function getContent()
    {
        return base64_decode($this->content);
    }



    /**
     * @return mixed
     */
    public function getEdited()
    {
        return $this->edited;
    }

    /**
     * @param mixed $edited
     */
    public function setEdited($edited)
    {
        $this->edited = $edited;
    }

    /**
     * @return mixed
     */
    public function getPinned()
    {
        return $this->pinned;
    }

    /**
     * @param mixed $pinned
     */
    public function setPinned($pinned)
    {
        $this->pinned = $pinned;
    }

    /**
     * @return mixed
     */
    public function getResponseTo()
    {
        return $this->responseTo;
    }

    /**
     * @param mixed $responseTo
     */
    public function setResponseTo($responseTo)
    {
        $this->responseTo = $responseTo;
    }

    /**
     * @return mixed
     */
    public function getSubject()
    {
        return $this->subject;
    }

    /**
     * @param mixed $subject
     */
    public function setSubject($subject)
    {
        $this->subject = $subject;
    }



    public function getArray(){
        $applicationSender = Array();
        if($this->getApplicationSender() != null){
            $applicationSender = $this->getApplicationSender()->getArray();
        }
        return Array(
            "id" => $this->getId(),
            "senderType" => $this->getTypeSender(),
            "applicationSender" => ($this->getApplicationSender()!=null)?$this->getApplicationSender()->getId():null,
            "userSender" => ($this->getUserSender()!=null)?$this->getUserSender()->getId():null,
            "recieverType" => $this->getTypeReciever(),
            "streamReciever" => ($this->getStreamReciever()!=null)?$this->getStreamReciever()->getId()  :null,
            "userReciever" => ($this->getUserReciever()!=null)?$this->getUserReciever()->getId():null,
            "content" => $this->getContent(),
            "cleanContent" => $this->getCleanContent(),
            "date" => $this->getDate(),
            "edited" => $this->getEdited(),
            "pinned" => $this->getPinned(),
            "subject" => ($this->getSubject()!=null)?$this->getSubject()->getId():null,
        );

    }




}
