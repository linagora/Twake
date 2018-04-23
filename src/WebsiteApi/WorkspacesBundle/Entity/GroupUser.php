<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * GroupUser
 *
 * @ORM\Table(name="group_user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupUserRepository")
 */
class GroupUser
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	protected $user;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	protected $group;

	/**
	 * @ORM\Column(name="level", type="integer")
	 */
	protected $level;

    /**
     * @ORM\Column(name="nb_workspace", type="integer")
     */
    protected $nbWorkspace;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;

	public function __construct($group, $user) {
		$this->group = $group;
		$this->user = $user;
		$this->level = 0;
		$this->date_added = new \DateTime();
		$this->nbWorkspace = 1;
	}

	public function getId(){
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getUser()
	{
		return $this->user;
	}

	/**
	 * @param mixed $user
	 */
	public function setUser($user)
	{
		$this->user = $user;
	}

	/**
	 * @return mixed
	 */
	public function getGroup()
	{
		return $this->group;
	}

	/**
	 * @param mixed $group
	 */
	public function setGroup($group)
	{
		$this->group = $group;
	}

	/**
	 * @return mixed
	 */
	public function getLevel()
	{
		return $this->level;
	}

	/**
	 * @param mixed $level
	 */
	public function setLevel($level)
	{
		$this->level = $level;
	}

    /**
     * @return mixed
     */
    public function getNbWorkspace()
    {
        return $this->nbWorkspace;
    }

    /**
     * @param mixed $nbWorkspace
     */
    public function setNbWorkspace($nbWorkspace)
    {
        $this->nbWorkspace = $nbWorkspace;
    }

    public function increaseNbWorkspace()
    {
        return $this->nbWorkspace = $this->nbWorkspace+1;
    }

    public function decreaseNbWorkspace()
    {
        return $this->nbWorkspace = $this->nbWorkspace-1;
    }

}
