<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="stream_member",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\StreamMemberRepository")
 */
class StreamMember
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\Column(type="text", options={"index": true})
     */
    protected $user_stream_id;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
    private $user;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Stream", cascade={"persist"})
	 */
	private $stream;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $mute;

    /**
     * @ORM\Column(type="twake_datetime", options={"default" : "1970-01-02"})
     */
    private $last_read;

    /**
     * @ORM\Column(type="twake_datetime", options={"default" : "1970-01-02"})
     */
    private $last_update;

    /**
     * @ORM\Column(type="integer")
     */
    private $unread = 0;

    /**
     * @ORM\Column(type="integer")
     */
    private $subject_unread = 0;



    public function __construct($stream, $user) {
    	$this->workspace = $stream->getWorkspace();
	    $this->setStream($stream);
	    $this->setUser($user);

        $this->user_stream_id = $user->getId() . "_" . $stream->getId();

	    $this->setMute(false);
	    $this->setLastRead();
        $this->setLastUpdate();
	}

    public function getId() {
        return $this->id;
    }

	public function getStream() {
		return $this->stream;
	}

	public function getUser() {
		return $this->user;
	}

	public function getMute() {
    	return $this->mute;
	}

	public function setId($id) {
		$this->id = $id;
	}

	public function setStream($stream) {
		$this->stream = $stream;
	}

	public function setUser($user) {
		$this->user = $user;
	}

	public function setMute($mute) {
    	$this->mute = $mute;
	}

	/**
	 * @return mixed
	 */
	public function getUnread()
	{
		return $this->unread;
	}

	/**
	 * @param mixed $unread
	 */
	public function setUnread($unread)
	{
		$this->unread = $unread;
	}

	/**
	 * @return mixed
	 */
	public function getWorkspace()
	{
		return $this->workspace;
	}

	/**
	 * @param mixed $workspace
	 */
	public function setWorkspace($workspace)
	{
		$this->workspace = $workspace;
	}

    /**
     * @return mixed
     */
    public function getLastRead()
    {
        return $this->last_read;
    }

    /**
     * @param mixed $last_read
     */
    public function setLastRead()
    {
        $this->last_read = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getLastUpdate()
    {
        return $this->last_update;
    }

    /**
     * @param mixed $last_update
     */
    public function setLastUpdate()
    {
        $this->last_update = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getSubjectUnread()
    {
        return $this->subject_unread;
    }

    /**
     * @param mixed $subject_unread
     */
    public function setSubjectUnread($subject_unread)
    {
        $this->subject_unread = $subject_unread;
    }

    public function getAsArray(){
        return Array(
            "notifications" => $this->getUnread(),
            "subject_notifications" => $this->getSubjectUnread(),
            "lastread" => $this->getLastRead()?$this->getLastRead()->getTimestamp():null
        );
    }


}

