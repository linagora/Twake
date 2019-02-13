<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
	private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
	 */
    private $usersender;

    /**
     * @ORM\Column(type="string", length=1)
     */
    private $typereciever;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
	 */
    private $userreciever;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Stream",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
	 */
    private $streamreciever;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $isapplicationmessage = false;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $applicationsender;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $issystemmessage = false;




    /**
     * @ORM\Column(type="twake_datetime",nullable=true)
	 */
	private $date;

    /**
     * @ORM\Column(type="twake_text", length=30000)
     * @Encrypted
     */
    private $htmlcontent = "";

	/**
     * @ORM\Column(type="twake_text")
     * @Encrypted
	 */
	private $content;

	/**
     * @ORM\Column(type="twake_text")
     * @Encrypted
	 */
    private $cleancontent;


	/**
     * @ORM\Column(type="twake_boolean")
	 */
	private $edited = false;

	/**
     * @ORM\Column(type="twake_boolean")
	 */
	private $pinned = false;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
	 */
    private $responseto = null;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $hasresponses = false;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Subject",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
	 */
	private $subject = null;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $applicationdata = "{}";

    /**
     * @ORM\Column(type="string", length=40)
     */
    private $front_id;


    public function __construct($sender, $typereciever, $reciever, $isapplicationmessage, $applicationmessage, $issystemmessage, $date, $content, $cleancontent, $subject)
    {
        $this->setUserSender($sender);
        if ($isapplicationmessage) {
            $this->setIsApplicationMessage($isapplicationmessage);
            $this->setApplicationSender($applicationmessage);
        }

        $this->setTypeReciever($typereciever);
        if ($typereciever == "S") {
            $this->setstreamreciever($reciever);
        } elseif ($typereciever == "U") {
            $this->setUserReciever($reciever);
        }
        $this->setIsSystemMessage($issystemmessage);
        $this->setDate($date);
        $this->setContent($content);
        $this->setCleanContent($cleancontent);
        if($subject != null){
            $this->setSubject($subject);
        }
    }

    /**
     * @return mixed
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
    public function getUserSender()
    {
        return $this->usersender;
    }

    /**
     * @param mixed $usersender
     */
    public function setUserSender($usersender)
    {
        $this->usersender = $usersender;
    }

    /**
     * @return mixed
     */
    public function getTypeReciever()
    {
        return $this->typereciever;
    }

    /**
     * @param mixed $typereciever
     */
    public function setTypeReciever($typereciever)
    {
        $this->typereciever = $typereciever;
    }

    /**
     * @return mixed
     */
    public function getUserReciever()
    {
        return $this->userreciever;
    }

    /**
     * @param mixed $userreciever
     */
    public function setUserReciever($userreciever)
    {
        $this->userreciever = $userreciever;
    }

    /**
     * @return mixed
     */
    public function getstreamreciever()
    {
        return $this->streamreciever;
    }

    /**
     * @param mixed $streamreciever
     */
    public function setstreamreciever($streamreciever)
    {
        $this->streamreciever = $streamreciever;
    }

    /**
     * @return mixed
     */
    public function getIsApplicationMessage()
    {
        return $this->isapplicationmessage;
    }

    /**
     * @param mixed $isapplicationmessage
     */
    public function setIsApplicationMessage($isapplicationmessage)
    {
        $this->isapplicationmessage = $isapplicationmessage;
    }

    /**
     * @return mixed
     */
    public function getApplicationSender()
    {
        return $this->applicationsender;
    }

    /**
     * @param mixed $applicationsender
     */
    public function setApplicationSender($applicationsender)
    {
        $this->applicationsender = $applicationsender;
    }

    /**
     * @return mixed
     */
    public function getIsSystemMessage()
    {
        return $this->issystemmessage;
    }

    /**
     * @param mixed $issystemmessage
     */
    public function setIsSystemMessage($issystemmessage)
    {
        $this->issystemmessage = $issystemmessage;
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
    public function getContent()
    {
        return base64_decode($this->content);
    }

    /**
     * @param mixed $content
     */
    public function setContent($content)
    {
        $this->content = base64_encode($content);
    }

    /**
     * @return mixed
     */
    public function getHtmlContent()
    {
        return base64_decode($this->content);
    }

    /**
     * @param mixed $content
     */
    public function setHtmlContent($content)
    {
        $tmp = base64_encode($content);

        //Important : remove dangerous html
        $tmp = str_replace(
            Array("<script"),
            Array("&#60;script"),
            $tmp
        );

        $this->content = $tmp;
    }

    /**
     * @return mixed
     */
    public function getCleanContent()
    {
        return $this->cleancontent;
    }

    /**
     * @param mixed $cleancontent
     */
    public function setCleanContent($cleancontent)
    {
        $this->cleancontent = $cleancontent;
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
        return $this->responseto;
    }

    /**
     * @param mixed $responseto
     */
    public function setResponseTo($responseto)
    {
        $this->responseto = $responseto;
    }

    /**
     * @return mixed
     */
    public function getHasResponses()
    {
        return $this->hasresponses;
    }

    /**
     * @param mixed $hasresponses
     */
    public function setHasResponses($hasresponses)
    {
        $this->hasresponses = $hasresponses;
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

    /**
     * @return mixed
     */
    public function getApplicationData()
    {
        return json_decode($this->applicationdata, true);
    }

    /**
     * @param mixed $applicationdata
     */
    public function setApplicationData($applicationdata)
    {
        $this->applicationdata = json_encode($applicationdata);
    }

    public function getDiscussionKey(){
        $key = "";
        if ($this->getTypeReciever() == "S" && $this->getstreamreciever() != null) {
            $key = $this->getstreamreciever()->getId();
        }
        else{
            if($this->getUserSender()!=null && $this->getUserReciever()!=null){
                $key = $this->getUserSender()->getId()."_".$this->getUserReciever()->getId();
            }
        }
        return $key;
    }

    /**
     * @return mixed
     */
    public function getFrontId()
    {
        return $this->front_id;
    }

    /**
     * @param mixed $front_id
     */
    public function setFrontId($front_id)
    {
        $this->front_id = $front_id;
    }

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "userSender" => ($this->getUserSender()!=null)?$this->getUserSender()->getId():null,
            "recieverType" => $this->getTypeReciever(),
            "streamreciever" => ($this->getstreamreciever() != null) ? $this->getstreamreciever()->getId() : null,
            "userReciever" => ($this->getUserReciever()!=null)?$this->getUserReciever()->getId():null,
            "isApplicationMessage" => $this->getIsApplicationMessage(),
            "applicationSender" => ($this->getApplicationSender()!=null)?$this->getApplicationSender()->getAsArray():null,
            "isSystemMessage" => $this->getIsSystemMessage(),
            "content" => $this->getContent(),
            "cleanContent" => $this->getCleanContent(),
            "date" => $this->getDate()?$this->getDate()->getTimestamp()*1000:null,
            "edited" => $this->getEdited(),
            "pinned" => $this->getPinned(),
            "subject" => ($this->getSubject()!=null)?$this->getSubject()->getAsArray():null,
            "applicationData" => $this->getApplicationData(),
            "responseTo" => ($this->getResponseTo() != null) ? $this->getResponseTo()->getId() : null,
        );

    }

    public function getAsArrayForClient(){
        return Array(
            "id" => $this->getId(),
            "userSender" => ($this->getUserSender()!=null)?$this->getUserSender()->getId():null,
            "streamreciever" => ($this->getstreamreciever() != null) ? $this->getstreamreciever()->getId() : null,
            "userReciever" => ($this->getUserReciever()!=null)?$this->getUserReciever()->getId():null,
            "htmlContent" => $this->getHtmlContent(),
            "content" => $this->getContent(),
            "date" => $this->getDate()?$this->getDate()->getTimestamp()*1000:null,
            "edited" => $this->getEdited(),
            "pinned" => $this->getPinned(),
            "subject" => ($this->getSubject()!=null)?$this->getSubject()->getAsArray():null,
            "responseTo" => ($this->getResponseTo() != null) ? $this->getResponseTo()->getId() : null,
        );
    }




}
