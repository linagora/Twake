<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="stream",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\StreamRepository")
 */
class Stream
{
	/**
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\Column(name="stream_type", type="string", length=255)
	 */
	private $type;

	/**
	 * @ORM\Column(name="stream_key", type="string", length=255, nullable=true)
	 */
	private $key;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
    private $workspace;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;

    /**
     * @ORM\Column(type="string")
     */
    private $description = "";

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $isPrivate;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\DiscussionBundle\Entity\StreamMember", mappedBy="stream")
	 */
	private $membersLinks;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message", mappedBy="streamReceiver")
	 */
	private $messages;



    public function __construct($workspace, $name, $isPrivate, $description) {

	    $this->setWorkspace($workspace);
	    $this->setName($name);
        $this->setIsPrivate($isPrivate);
        $this->setDescription($description);
	}

    public function getId() {
        return $this->id;
    }

	public function getWorkspace() {
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

	public function setWorkspace($workspace) {
		$this->workspace = $workspace;
	}

	public function setName($name) {
		$this->name = $name;
	}

	public function addMember($user) {
    	$memberLink = new StreamMember($this, $user);
		$this->membersLinks[] = $memberLink;
		return $memberLink;
	}

	public function getLinkUser($user){
        foreach ($this->membersLinks as $memberLink) {
            if($memberLink->getUser() == $user){
                return $memberLink;
            }
        }
        return null;
    }

    public function getIsPrivate(){
        return $this->isPrivate;
    }
    public function setIsPrivate($x){
        $this->isPrivate = ($x)?true:false;
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

	/**
	 * @return mixed
	 */
	public function getType()
	{
		return $this->type;
	}

	/**
	 * @param mixed $type
	 */
	public function setType($type)
	{
		$this->type = $type;
	}

	/**
	 * @return mixed
	 */
	public function getKey()
	{
		return $this->key;
	}

	/**
	 * @param mixed $key
	 */
	public function setKey($key)
	{
		$this->key = $key;
	}

    public function getAsArray(){
        $members = [];
        $membersLink = $this->getMembersLinks();
        foreach ($membersLink as $link){
            $members[] = $link->getUser()->getAsArray();
        }
        $key = "s:";
	    if($this->type=="user"){
		    $key="u:";
	    }
	    if($this->type=="public"){
		    $key="p:";
	    }
        $key .= $this->getKey()?$this->getKey():$this->getId();
        return(
            Array(
                "id" => $this->getId(),
                "name" => $this->getName(),
                "workspace" => $this->getWorkspace()?$this->getWorkspace()->getId():null,
                "isPrivate" => $this->getIsPrivate(),
                "members" => $members,
                "description"=>$this->getDescription(),
	            "key"=>$key,
	            "type"=>$this->getType()?$this->getType():"stream"
            )
        );
    }

}
