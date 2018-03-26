<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="stream_member",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\StreamRepository")
 */
class StreamMember
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

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
	 * @ORM\Column(type="boolean")
	 */
	private $mute;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $unread = 0;



    public function __construct($stream, $user) {
    	$this->workspace = $stream->getWorkspace();
	    $this->setStream($stream);
	    $this->setUser($user);
	    $this->setMute(false);
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



}

