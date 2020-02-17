<?php

namespace Twake\Users\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\SearchableObject;

/**
 * Mail
 *
 * @ORM\Table(name="mail",options={"engine":"MyISAM",
 *
 *     "scylladb_keys": {{"id":"ASC"}, {"user_id":"ASC"},{"mail":"ASC"}}
 * })
 * @ORM\Entity()
 */
class Mail extends SearchableObject
{

    protected $es_type = "mail";

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     */
    private $user_id;

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
     * @return string
     */
    public function getEsType()
    {
        return $this->es_type;
    }


    /**
     * Set user
     *
     * @param integer $user
     *
     * @return Mail
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

    /**
     * Get user
     *
     * @return int
     */
    public function getUserId()
    {
        return $this->user_id;
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

    public function getIndexationArray()
    {
        $return = Array(
            "id" => $this->getId() . "",
            "mail" => $this->getMail()
        );
        return $return;
    }

}

