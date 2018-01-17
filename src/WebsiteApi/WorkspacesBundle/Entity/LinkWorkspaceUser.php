<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Repository\LinkWorkspaceUserRepository;

/**
 * LinkWorkspaceUser
 *
 * @ORM\Table(name="link_workspace_user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\LinkWorkspaceUserRepository")
 */
class LinkWorkspaceUser
{


	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;
	
    /**
     *
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
	protected $Workspace;

	/**
	 *
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="workspacesLinks")
	 */
	protected $User;

	/**
	 *
	 * @ORM\Column(name="usernamecache", type="string", length=30)
	 */
	protected $usernamecache;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="statusUser", type="string", length=1)
	 */
	protected $status;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="mail", type="string", length=350, nullable=true)
	 */
	protected $mail; //Used if user added by mail and waiting for invitation complete


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Level")
     */
    private $level;

    function __construct() {
	    $this->usernamecache = "";
    }

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->Workspace;
    }

    /**
     * @param mixed $Workspace
     */
    public function setGroup($Workspace)
    {
        $this->Workspace = $Workspace;
    }

    /**
     * @return mixed
     */
    public function getUser()
    {
        return $this->User;
    }

    /**
     * @param mixed $User
     */
    public function setUser($User)
    {
        $this->User = $User;
	    $this->usernamecache = $User->getUsername();
    }


    public function setStatus($statusUser)
    {
        $this->status = $statusUser;

        return $this;
    }

    /**
     * Get statusUser
     *
     * @return string
     */
    public function getStatus()
    {
        return $this->status;
    }

    public function getLevel(){
        return $this->level;
    }

    public function setLevel($x){
        $this->level = $x;
    }

	/**
	 * @return string
	 */
	public function getMail()
	{
		return $this->mail;
	}

	/**
	 * @param string $mail
	 */
	public function setMail($mail)
	{
		$this->mail = $mail;
	}

	/**
	 * @return mixed
	 */
	public function getUsernamecache()
	{
		return $this->usernamecache;
	}

	/**
	 * @param mixed $usernamecache
	 */
	public function setUsernamecache($usernamecache)
	{
		$this->usernamecache = $usernamecache;
	}



}
