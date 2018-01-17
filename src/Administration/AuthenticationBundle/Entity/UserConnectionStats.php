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
 * @ORM\Table(name="user_temp_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\UserTempStatsRepository")
 */

class UserConnectionStats
{
    /**
     * @ORM\Id/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="temp_stat")
     */
    protected $user;

    /**
    * @ORM\Column(name="date", type="datetime")
    */
    protected $date;


    /**
     * @var int
     * @ORM\Column(name="duree_connection", type="integer")
     */
    protected $dureeConnection;

}