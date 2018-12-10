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
 * @ORM\Table(name="workspace_daily_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\WorkspaceDailyStatsRepository")
 */
class WorkspaceDailyStats
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
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
    protected $publicmsgcount;

	/**
	 * @var int
     * @ORM\Column(name="private_msg_count", type="integer")
	 */
    protected $privatemsgcount;

	/**
	 * @var int
     * @ORM\Column(name="private_channel_msg_count", type="integer")
	 */
    protected $privatechannelmsgcount;
    /**
     * @ORM\Column(name="date", type="twake_datetime")
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
        return $this->publicmsgcount;
	}

	public function getPrivateMsgCount(){
        return $this->privatemsgcount;
	}

	public function getPrivateChannelMsgCount(){
        return $this->privatechannelmsgcount;
	}

    public function getDate(){
        return $this->date;
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

	/**
     * @param int $privatechannelmsgcount
	 */
    public function setPrivateChannelMsgCount($privatechannelmsgcount)
    {
        $this->privatechannelmsgcount = $privatechannelmsgcount;
	}

    /**
     * @param date $date
     */
    public function setDate($date)
    {
        $this->date = $date;
    }


}
