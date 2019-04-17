<?php


namespace WebsiteApi\GlobalSearchBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\CoreBundle\Entity\SearchableObject;

/**
 * Application
 *
 * @ORM\Table(name="application",options={"engine":"MyISAM", "scylladb_keys": {{"group_id": "ASC", "app_group_name": "ASC", "id": "ASC"}, {"id": "ASC"}, {"simple_name": "ASC"}, {"default": "ASC"}}})
 * @ORM\Entity(repositoryClass="WebsiteApi\MarketBundle\Repository\ApplicationRepository")
 */
class User extends SearchableObject
{

    protected $es_type = "users";

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;
    /**
     * @ORM\Column(name="username", type="twake_text", options={"index": true})
     * @Encrypted
     */
    protected $username="";
    /**
     * @ORM\Column(name="fullname", type="twake_text", options={"index": true})
     * @Encrypted
     */
    protected $fullname="";
    /**
     * @ORM\Column(name="email", type="string", length=512, options={"index": true})
     */
    protected $email="";

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "username" => $this->getUsername(),
            "fullname" => $this->getFullname(),
            "email" => $this->getEmail(),
        );
        return $return;
    }
    
    public function getId()
    {
        return $this->id;
    }

    public function getUsername()
    {
        return $this->username;
    }

    public function getFullname()
    {
        return $this->fullname;
    }

    public function getEmail()
    {
        return $this->email;
    }


}