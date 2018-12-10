<?php

namespace WebsiteApi\NotificationsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

/**
 * Mail
 *
 * @ORM\Table(name="notification",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\NotificationsBundle\Repository\NotificationRepository")
 */
class Notification
{
	/**
	 * @var int
	 *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
	 */
	private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
	 */
	private $application;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	private $user;

	/**
     * @ORM\Column(type="text", nullable=true)
     * @Encrypted
	 */
	private $code;

	/**
     * @ORM\Column(type="text",  nullable=true)
     * @Encrypted
	 */
	private $title;

	/**
     * @ORM\Column(type="text",  nullable=true)
     * @Encrypted
	 */
	private $text;

    /**
     * @ORM\Column(type="text")
     * @Encrypted
     */
    private $data = "{}";

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date;

    /**
     * @ORM\Column(type="integer", nullable=false)
     */
    private $mail_sent = 0;

    /**
     * @ORM\Column(type="twake_datetime", nullable=true)
     */
    private $last_mail = null;

    /**
     * @ORM\Column(type="twake_boolean" , options={"default" : true})
     */
    private $isread;

	public function __construct($application, $workspace, $user)
	{
		$this->date = new \DateTime();
		$this->application = $application;
		$this->workspace = $workspace;
		$this->user = $user;
		$this->setIsRead(false);
	}

	/**
	 * @return int
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getApplication()
	{
		return $this->application;
	}

	/**
	 * @return mixed
	 */
	public function getWorkspace()
	{
		return $this->workspace;
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
	public function getUser()
	{
		return $this->user;
	}

	/**
	 * @return mixed
	 */
	public function getCode()
	{
		return $this->code;
	}

	/**
	 * @param mixed $code
	 */
	public function setCode($code)
	{
		$this->code = $code;
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
	public function getText()
	{
		return $this->text;
	}

	/**
	 * @param mixed $text
	 */
	public function setText($text)
	{
		$this->text = $text;
	}

	/**
	 * @return mixed
	 */
	public function getData()
	{
		if(!$this->data){
			return null;
		}
		return json_decode($this->data, 1);
	}

	/**
	 * @param mixed $data
	 */
	public function setData($data)
	{
		$this->data = json_encode($data);
	}

    /**
     * @return mixed
     */
    public function getMailSent()
    {
        return $this->mail_sent;
    }

    /**
     * @param mixed $mail_sent
     */
    public function setMailSent($mail_sent)
    {
        $this->mail_sent = $mail_sent;
    }

    /**
     * @return mixed
     */
    public function getLastMail()
    {
        return $this->last_mail;
    }

    /**
     * @param mixed $last_mail
     */
    public function setLastMail($last_mail)
    {
        $this->last_mail = $last_mail;
    }

	public function getAsArray(){
		return Array(
			"id" => $this->getId(),
			"date" => $this->getDate()->getTimestamp(),
			"code" => $this->getCode(),
			"workspace_id" => ($this->getWorkspace()?$this->getWorkspace()->getId():null),
			"app_id" => ($this->getApplication()?$this->getApplication()->getId():null),
			"title" => $this->getTitle(),
			"text" => $this->getText(),
            "is_read" => $this->getisRead(),
			"data" => $this->getData()
		);
	}

    /**
     * @return mixed
     */
    public function getisRead()
    {
        return $this->isread;
    }

    /**
     * @param mixed $isread
     */
    public function setIsRead($isread)
    {
        $this->isread = $isread;
    }

}

