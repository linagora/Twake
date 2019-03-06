<?php

namespace WebsiteApi\UsersBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * Mail
 *
 * @ORM\Table(name="mail",options={"engine":"MyISAM",
 *
 *     "scylladb_keys": {{"id":"ASC"}, {"user_id":"ASC"},{"mail":"ASC"}}
 * })
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\MailRepository")
 */
class Mail
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="secondary_mails")
	 */
    private $user;

    /**
     * @var string
     *
     * @ORM\Column(name="mail", type="string", length=350)
     */
    private $mail;


    /**
     * Get id
     *
     * @return int
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }

    /**
     * Set user
     *
     * @param integer $user
     *
     * @return Mail
     */
    public function setUser($user)
    {
        $this->user = $user;

        return $this;
    }

    /**
     * Get user
     *
     * @return int
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * Set mail
     *
     * @param string $mail
     *
     * @return Mail
     */
    public function setMail($mail)
    {
        $this->mail = $mail;

        return $this;
    }

    /**
     * Get mail
     *
     * @return string
     */
    public function getMail()
    {
        return $this->mail;
    }

}

