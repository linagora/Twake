<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * WorkspaceStats
 *
 * @ORM\Table(name="workspace_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceStatsRepository")
 */
class WorkspaceStats
{
    /**
     * @ORM\Id/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace", inversedBy="stat")
     */
    protected $workspace;

    /**
     * @var int
     * @ORM\Column(name="public_msg_count", type="integer")
     */
    protected $publicMsgCount = 0;
	/**
	 * @var int
	 * @ORM\Column(name="private_msg_count", type="integer")
	 */
	protected $privateMsgCount = 0;
	/**
	 * @var int
	 * @ORM\Column(name="private_channel_msg_count", type="integer")
	 */
	protected $privateChannelMsgCount = 0;

	/**
	 * WorkspaceStats constructor.
	 * @param $workspace
	 */
	public function __construct($workspace)
	{
		$this->workspace = $workspace;
	}

	/**
	 * @return mixed
	 */
	public function getWorkspace()
	{
		return $this->workspace;
	}


	public function getPublicMsgCount(){
        return $this->publicMsgCount;
    }

    public function getPrivateMsgCount(){
        return $this->privateMsgCount;
    }

	public function getPrivateChannelMsgCount(){
		return $this->privateChannelMsgCount;
	}

	/**
	 * @param int $publicMsgCount
	 */
	public function addPrivateChannelMsg($val=1)
	{
		$this->privateChannelMsgCount += $val;
	}

	/**
	 * @param int $publicMsgCount
	 */
	public function addPublicMsg($val=1)
	{
		$this->publicMsgCount += $val;
	}

	/**
	 * @param int $privateMsgCount
	 */
	public function addPrivateMsg($val=1)
	{
		$this->privateMsgCount += $val;
	}

	/**
	 * @param int $publicMsgCount
	 */
	public function setPublicMsgCount($publicMsgCount)
	{
		$this->publicMsgCount = $publicMsgCount;
	}

	/**
	 * @param int $privateMsgCount
	 */
	public function setPrivateMsgCount($privateMsgCount)
	{
		$this->privateMsgCount = $privateMsgCount;
	}

	/**
	 * @param int $privateChannelMsgCount
	 */
	public function setPrivateChannelMsgCount($privateChannelMsgCount)
	{
		$this->privateChannelMsgCount = $privateChannelMsgCount;
	}



}
