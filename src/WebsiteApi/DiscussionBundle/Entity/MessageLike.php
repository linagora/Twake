<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="message_like",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\MessageRepository")
 */
class MessageLike
{
	/**
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
	 */
	private $user;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message")
	 */
	private $message;

	/**
	 * @ORM\Column(name="type", type="integer")
	 */
	private $type;

	private $types = Array(
		"up" => 0,
		"down" => 1,
		"ok" => 2,
		"clap" => 3,
		"heart" => 4,
		"smile" => 5,
		"rage" => 6,
		"chocked" => 7,
		"sob" => 8,
		"dead" => 9
	);

	private $typesReversed = Array(
		"up",
		"down",
		"ok",
		"clap",
		"heart",
		"smile",
		"rage",
		"chocked",
		"sob",
		"dead"
	);

	public function __construct($user, $message, $type)
	{
		$this->user = $user;
		$this->message = $message;
		$this->setType($type);
	}

	public function setType($type)
	{
		if (!isset($this->types[$type])) {
			$type = "smile";
		}
		$this->type = $this->types[$type];
	}

	public function getType()
	{
		return $this->typesReversed[$this->type];
	}

}
