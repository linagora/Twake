<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
	 */
	private $id;

	/**
     * @ORM\Column(name="stream_type", type="string", length=255)
	 */
	private $type = "stream";

	/**
     * @ORM\Column(name="stream_key", type="string", length=255, nullable=true)
	 */
	private $key;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
    private $workspace;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $name;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $description = "";

	/**
     * @ORM\Column(type="twake_boolean")
	 */
    private $isprivate;

    /**
     * @ORM\Column(type="twake_boolean", options={"default" : false })
     */
    private $ishide;

	/**
     * @ORM\OneToMany(targetEntity="WebsiteApi\DiscussionBundle\Entity\StreamMember", mappedBy="stream")
	 */
    private $memberslinks;

	/**
     * @ORM\OneToMany(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message", mappedBy="streamReceiver")
	 */
	private $messages;


    public function __construct($workspace, $name, $isprivate, $description)
    {

	    $this->setWorkspace($workspace);
	    $this->setName($name);
        $this->setIsPrivate($isprivate);
        $this->setDescription($description);
        $this->setMembersLinks(Array());
        $this->setIsHide(false);
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
        return $this->memberslinks;
	}

	public function getMessages() {
		return $this->messages;
	}

	public function getMembers() {

    	$members = Array();

        foreach ($this->memberslinks as $memberlink) {
            $members[] = $memberlink->getUser();
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
        $memberlink = new StreamMember($this, $user);
        $this->membersLinks[] = $memberlink;
        return $memberlink;
	}

	public function getLinkUser($user){
        foreach ($this->memberslinks as $memberlink) {
            if ($memberlink->getUser() == $user) {
                return $memberlink;
            }
        }
        return null;
    }

    public function getIsPrivate(){
        return $this->isprivate;
    }
    public function setIsPrivate($x){
        $this->isprivate = ($x) ? true : false;
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
		return $this->type?$this->type:"stream";
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
        $memberslink = $this->getMembersLinks();
        foreach ($memberslink as $link) {
            $members[] = $link->getUser()->getAsArray();
        }
        $key = "s-";
	    if($this->type=="user"){
		    $key="u-";
	    }
	    if($this->type=="public"){
		    $key="p-".$this->getId()."_";
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
	            "type"=>$this->getType()
            )
        );
    }

    private function setMembersLinks($array)
    {
        $this->memberslinks = $array;
    }

    /**
     * @return mixed
     */
    public function getisHide()
    {
        return $this->ishide;
    }

    /**
     * @param mixed $ishide
     */
    public function setIsHide($ishide)
    {
        $this->ishide = $ishide;
    }

}
