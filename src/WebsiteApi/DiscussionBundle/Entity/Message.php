<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
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
     * @ORM\Column(type="string", length=1)
     */
    private $typeReciever;

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
     * @ORM\Column(type="boolean")
     */
    private $isApplicationMessage = false;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $applicationSender;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isSystemMessage = false;




    /**
	 * @ORM\Column(type="datetime",nullable=true)
	 */
	private $date;

    /**
     * @ORM\Column(type="text", length=30000)
     */
    private $htmlContent = "";

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
     * @ORM\Column(type="boolean")
     */
    private $hasResponses = false;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Subject",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $subject = null;

    /**
     * @ORM\Column(type="text")
     */
    private $applicationData = "{}";

    /**
     * @ORM\Column(type="string", length=40)
     */
    private $front_id;


	public function __construct($sender,$typeReciever,$reciever,$isApplicationMessage,$applicationMessage,$isSystemMessage,$date,$content,$cleanContent,$subject){
        $this->setUserSender($sender);
        if($isApplicationMessage) {
            $this->setIsApplicationMessage($isApplicationMessage);
            $this->setApplicationSender($applicationMessage);
        }

        $this->setTypeReciever($typeReciever);
        if($typeReciever == "S"){
            $this->setStreamReciever($reciever);
        }
        elseif($typeReciever == "U"){
            $this->setUserReciever($reciever);
        }
        $this->setIsSystemMessage($isSystemMessage);
        $this->setDate($date);
        $this->setContent($content);
        $this->setCleanContent($cleanContent);
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
    public function getIsApplicationMessage()
    {
        return $this->isApplicationMessage;
    }

    /**
     * @param mixed $isApplicationMessage
     */
    public function setIsApplicationMessage($isApplicationMessage)
    {
        $this->isApplicationMessage = $isApplicationMessage;
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
    public function getIsSystemMessage()
    {
        return $this->isSystemMessage;
    }

    /**
     * @param mixed $isSystemMessage
     */
    public function setIsSystemMessage($isSystemMessage)
    {
        $this->isSystemMessage = $isSystemMessage;
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
        return $this->cleanContent;
    }

    /**
     * @param mixed $cleanContent
     */
    public function setCleanContent($cleanContent)
    {
        $this->cleanContent = $cleanContent;
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
    public function getHasResponses()
    {
        return $this->hasResponses;
    }

    /**
     * @param mixed $hasResponses
     */
    public function setHasResponses($hasResponses)
    {
        $this->hasResponses = $hasResponses;
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
        return json_decode($this->applicationData,true);
    }

    /**
     * @param mixed $applicationData
     */
    public function setApplicationData($applicationData)
    {
        $this->applicationData = json_encode($applicationData);
    }

    public function getDiscussionKey(){
        $key = "";
        if($this->getTypeReciever()=="S" && $this->getStreamReciever()!=null){
            $key = $this->getStreamReciever()->getId();
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
            "streamReciever" => ($this->getStreamReciever()!=null)?$this->getStreamReciever()->getId()  :null,
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
            "streamReciever" => ($this->getStreamReciever()!=null)?$this->getStreamReciever()->getId()  :null,
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
