<?php

namespace Administration\AuthenticationBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * WorkspaceStats
 *
 * @ORM\Table(name="workspace_daily_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\WorkspaceDailyStatsRepository")
 */
class WorkspaceDailyStats
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace", inversedBy="temp_stat")
     */
    protected $workspace;

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
	 * @var int
	 * @ORM\Column(name="private_channel_msg_count", type="integer")
	 */
	protected $privateChannelMsgCount;
    /**
     * @ORM\Column(name="date", type="datetime")
     */
    protected $date;


	/**
	 * @return mixed
	 */
	public function getWorkspace()
	{
		return $this->workspace;
	}

	/**
	 * @param mixed $workspace
	 */
	public function setWorkspace($workspace)
	{
		$this->workspace = $workspace;
	}

	/**
	 * @return mixed
	 */
	public function getId()
	{
		return $this->id;
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

    public function getDate(){
        return $this->date;
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

    /**
     * @param date $date
     */
    public function setDate($date)
    {
        $this->date = $date;
    }


}
