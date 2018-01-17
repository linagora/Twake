<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * WorkspaceStats
 *
 * @ORM\Table(name="workspace_temp_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\WorkspaceTempStatsRepository")
 */
class WorkspaceTempStats
{
    /**
     * @ORM\Id/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="temp_stat")
     */
    protected $user;
    /**
     * @var int
     * @ORM\Column(name="public_msg_count", type="integer")
     */
    protected $publicMsgCount;
    /**
     * @var int
     * @ORM\Column(name="private_msg_count", type="integer")
     */
    protected $privateMsgCount;
    /**
     * @ORM\Column(name="date", type="datetime")
     */
    protected $date;
}
