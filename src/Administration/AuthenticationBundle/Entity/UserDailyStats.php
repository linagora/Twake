<?php

namespace Administration\AuthenticationBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * WorkspaceStats
 *
 * @ORM\Table(name="user_daily_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\UserDailyStatsRepository")
 */
class UserDailyStats
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="temp_stat")
     */
    protected $user;
    /**
     * @var int
     * @ORM\Column(name="public_msg_count", type="integer")
     */
    protected $publicmsgcount;
    /**
     * @var int
     * @ORM\Column(name="private_msg_count", type="integer")
     */
    protected $privatemsgcount;
    /**
     * @ORM\Column(name="date", type="twake_datetime")
     */
    protected $date;


    public function setPublicMsgCount($publiccount)
    {
        $this->publicmsgcount = $publiccount;
    }

    public function setPrivateMsgCount($privatecount)
    {
        $this->privatemsgcount = $privatecount;
    }

    public function setDate($date){
        $this->date = $date;
    }

    public function setUser($u){
        $this->user = $u;
    }

}
