<?php

namespace WebsiteApi\CallsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

/**
 * Call
 *
 * @ORM\Table(name="calls",options={"engine":"myisam"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CallsBundle\Repository\CallRepository")
 */
class Call
{
	/**
	 * @var int
	 *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	private $id;

	/**
     * @ORM\Column(name="discussion_key", type="string", length=24)
	 */
    private $discussionkey;


	/**
	 *
	 * Number of clients
	 *
	 * @ORM\Column(name="clients", type="integer")
	 */
	private $nbclients;

	/**
	 *
	 * Date of start
	 *
     * @ORM\Column(name="since", type="cassandra_datetime")
	 */
	private $since;

	/**
	 *
	 * Access token for meet.twakeapp
	 *
     * @ORM\Column(name="token_column", type="string", length=256)
	 */
	private $token;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message")
     */

    private $message;


    public function __construct($key,$message){
		$this->since = new \DateTime();
		$this->nbclients = 0;
        $this->discussionkey = $key;
		$this->setMessage($message);
		$this->token = sha1(bin2hex(random_bytes(20)));
	}

	/**
	 * @return mixed
	 */
	public function getNbclients()
	{
		return $this->nbclients;
	}

	/**
	 * @param mixed $nbclients
	 */
	public function setNbclients($nbclients)
	{
		$this->nbclients = $nbclients;
	}


	public function getDiscussionKey(){
        return $this->discussionkey;
	}

	/**
	 * @return mixed
	 */
	public function getToken()
	{
		return $this->token;
	}

    /**
     * @return mixed
     */
    public function getMessage()
    {
        return $this->message;
    }

    /**
     * @param mixed $message
     */
    public function setMessage($message)
    {
        $this->message = $message;
    }



}

