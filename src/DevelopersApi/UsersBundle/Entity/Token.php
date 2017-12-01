<?php

namespace DevelopersApi\UsersBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Token
 *
 * @ORM\Table(name="token",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="DevelopersApi\UsersBundle\Repository\TokenRepository")
 */
class Token
{
	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\Column(name="date", type="datetime")
	 */
	private $date;

	/**
	 * @ORM\Column(name="token", type="string", length=128)
	 */
	private $token;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	private $user;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Orga")
	 */
	private $group;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
     */
	private $application;

	public function __construct(){
		$this->date = new \DateTime();
		$this->generateToken();
	}

	public function getId(){
		return $this->id;
	}

	public function getToken(){
		return $this->token;
	}
	public function setToken($x){
		$this->token = $x;
	}

	public function generateToken(){
		$this->token = sha1("a" . rand(1, 99999999) . "b" . rand(1, 99999999) . "c" . rand(1, 99999999) . "d");
		return $this->token;
	}


	public function getUser(){
		return $this->user;
	}
	public function setUser($x){
		$this->user = $x;
	}

	public function getApplication(){
		return $this->application;
	}
	public function setApplication($x){
		$this->application = $x;
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

}
