<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="channel_member",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\ChannelRepository")
 */
class ChannelMember
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
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Channel")
     */
    private $channel;

	/**
	 * @ORM\Column(type="boolean")
	 */
    private $mute;



    public function __construct($channel, $user) {

	    $this->setChannel($channel);
	    $this->setUser($user);
	    $this->setMute(false);
	}

    public function getId() {
        return $this->id;
    }

	public function getChannel() {
		return $this->channel;
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

	public function setChannel($channel) {
		$this->channel = $channel;
	}

	public function setUser($user) {
		$this->user = $user;
	}

	public function setMute($mute) {
    	$this->mute = $mute;
	}
}

