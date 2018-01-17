<?php

namespace WebsiteApi\UsersBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;

/**
 * UserStats
 *
 * @ORM\Table(name="user_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\UserStatsRepository")
 */
class UserStats
{
	/**
	 * @ORM\Id/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="stat")
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

    public function getPublicMsgCount(){
        return $this->publicMsgCount;
    }

    public function getPrivateMsgCount(){
        return $this->privateMsgCount;
    }

    public function getUser(){
        return $this->user;
    }
}
