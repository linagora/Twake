<?php

namespace WebsiteApi\UsersBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Token
 *
 * @ORM\Table(name="external_token",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\TokenRepository")
 */
class Token
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
    private $user;

    /**
     * @var string
     *
     * @ORM\Column(type="string", length=350, nullable=true)
     */
    private $token;

    /**
     * @var string
     *
     * @ORM\Column(name="external_service_name", type="string", length=350)
     */
    private $externalservicename;

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return string
     */
    public function getExternalServiceName()
    {
        return $this->externalservicename;
    }

    /**
     * @param string $externalservicename
     */
    public function setExternalServiceName($externalservicename)
    {
        $this->externalservicename = $externalservicename;
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
     * @return string
     */
    public function getToken()
    {
        var_dump($this->token);
        var_dump(json_decode("" . $this->token));
        if($this->token==null)
            return null;
        return json_decode($this->token);
    }

    /**
     * @param array $token
     */
    public function setToken($token)
    {
        if ($token == null)
            $this->token = null;
        else
            $this->token = json_encode($token);
    }

    public function __construct($tokenstring, $user, $externalservice)
    {
        $this->setToken($tokenstring);
        $this->setUser($user);
        $this->setExternalServiceName($externalservice);
    }
}

