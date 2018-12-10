<?php

namespace WebsiteApi\UsersBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use FOS\UserBundle\Model\User as BaseUser;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;

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
    protected $publicmsgcount = 0;

	/**
	 * @var int
     * @ORM\Column(name="private_msg_count", type="integer")
	 */
    protected $privatemsgcount = 0;

	/**
	 * UserStats constructor.
	 * @param $user
	 */
	public function __construct($user)
	{
		$this->user = $user;
	}

	public function getPublicMsgCount(){
        return $this->publicmsgcount;
	}

    /**
     * @param int $publicmsgcount
     */
    public function setPublicMsgCount($publicmsgcount)
    {
        $this->publicmsgcount = $publicmsgcount;
    }

    /**
     * @param int $privatemsgcount
     */
    public function setPrivateMsgCount($privatemsgcount)
    {
        $this->privatemsgcount = $privatemsgcount;
    }



	public function addPublicMsgCount($val=1){
        $this->publicmsgcount += $val;
	}

	public function getPrivateMsgCount(){
        return $this->privatemsgcount;
	}

	public function addPrivateMsgCount($val=1){
        $this->privatemsgcount += $val;
	}



    public function getUser(){
        return $this->user;
    }
}
