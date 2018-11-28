<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 17/01/18
 * Time: 10:30
 */

namespace Administration\AuthenticationBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * WorkspaceStats
 *
 * @ORM\Table(name="user_connection_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\UserConnectionStatsRepository")
 */

class UserConnectionStats
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
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="temp_stat")
     */
    protected $user;

    /**
     * @ORM\Column(name="date_connection", type="cassandra_datetime")
    */
    protected $dateconnection;


    /**
     * @var int
     * @ORM\Column(name="duree_connection", type="integer",nullable = true)
     */
    protected $dureeconnection;


    public function setUser($user)
    {
        $this->user = $user;
    }

    public function getUser()
    {
        return $this->user;
    }

    public function setDateConnection($date)
    {
        $this->dateconnection = $date;
    }

    public function getDateConnection()
    {
        return $this->dateconnection;
    }

    public function setDureeConnection($duree)
    {
        $this->dureeconnection = $duree;
    }

    public function getDureeConnection()
    {
        return $this->dureeconnection;
    }

}