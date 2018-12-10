<?php

namespace WebsiteApi\CallsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * CallMembers
 *
 * @ORM\Table(name="call_members",options={"engine":"myisam"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CallsBundle\Repository\CallMemberRepository")
 */
class CallMember
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
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
	 */
	private $user;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\CallsBundle\Entity\Call",cascade={"persist"})
	 */
	private $call;

	/**
	 *
	 * Date of start
	 *
     * @ORM\Column(name="since", type="twake_datetime")
	 */
	private $since;

	public function __construct($call, $user){
		$this->since = new \DateTime();
		$this->call = $call;
		$this->user = $user;
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
	public function getCall()
	{
		return $this->call;
	}

	/**
	 * @param mixed $call
	 */
	public function setCall($call)
	{
		$this->call = $call;
	}

	/**
	 * @return mixed
	 */
	public function getSince()
	{
		return $this->since;
	}

	/**
	 * @param mixed $since
	 */
	public function setSince($since)
	{
		$this->since = $since;
	}



}

