<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="channel",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\ChannelRepository")
 */
class Channel
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
    private $workspace;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;

    /**
     * @ORM\Column(type="boolean")
     */
    private $privacy;


	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\DiscussionBundle\Entity\ChannelMember", mappedBy="channel")
	 */
	private $membersLinks;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message", mappedBy="channelReceiver")
	 */
	private $messages;



    public function __construct($workspace, $name,$privacy) {

	    $this->setGroup($workspace);
	    $this->setName($name);
        $this->setPrivacy($privacy);
	}

    public function getId() {
        return $this->id;
    }

	public function getGroup() {
		return $this->workspace;
	}

	public function getName() {
		return $this->name;
	}

	public function getMembersLinks() {
        return $this->membersLinks;
	}

	public function getMessages() {
		return $this->messages;
	}

	public function getMembers() {

    	$members = Array();

    	foreach ($this->membersLinks as $memberLink) {
		    $members[] = $memberLink->getUser();
	    }

	    return $members;
	}

	public function setId($id) {
		$this->id = $id;
	}

	public function setGroup($workspace) {
		$this->workspace = $workspace;
	}

	public function setName($name) {
		$this->name = $name;
	}

	public function addMember($user) {

    	$memberLink = new ChannelMember($this, $user);
		$this->membersLinks[] = $memberLink;
		return $memberLink;
	}

    public function getPrivacy(){
        return $this->privacy;
    }
    public function setPrivacy($x){
        $this->privacy = $x;
    }


}
