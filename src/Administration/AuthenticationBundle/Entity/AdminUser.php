<?php

namespace Administration\AuthenticationBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * Contact
 *
 * @ORM\Table(name="admin_user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\AdminUserRepository")
 */
class AdminUser
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

    /**
     * @var int
     *
     * Utilisateur associé à ce compte administrateur
     *
     * @ORM\OneToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @var string
     *
     * Token utilisé pour vérifier la connexion
     * @ORM\Column(name="access_token", type="string", length=256)
     */

    private $accesstoken;

    /**
     * @ORM\Column(name="date_reset", type="twake_datetime")
     */
    private $datereset;


    /**
     * @var string
     *
     * Roles de l'utilisateur
     *
     * @ORM\Column(name="roles", type="string", length=256)
     */

    private $roles;

    public function __construct()
    {
        $this->setRoles(Array());
        $this->newAccessToken();
    }


    public function setAccessToken($x)
    {
        $this->accesstoken = $x;
    }

    public function getAccessToken()
    {
        return $this->accesstoken;
    }

    public function setDateReset($x)
    {
        $this->datereset = $x;
    }

    public function getDateReset()
    {
        return $this->datereset;
    }

    public function newAccessToken()
    {
        $token = hash("sha256", random_bytes(10));
        $this->setAccessToken($token);
        $this->setDateReset(new \DateTime("now"));
    }



    /**
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
     * @return int
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @param int $user
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
        return $this->token;
    }

    /**
     * @param string $token
     */
    public function setToken($token)
    {
        $this->token = $token;
    }

    /**
     * @return string
     */
    public function getRoles()
    {
	    $val = json_decode($this->roles, true);
	    if($val == null){
		    $val = Array();
	    }
        return $val;
    }

    /**
     * @param string $roles
     */
    public function setRoles($roles)
    {
        $this->roles = json_encode($roles);
    }



}
