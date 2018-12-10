<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 15/02/18
 * Time: 15:24
 */

namespace Administration\AuthenticationBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * ServerRamStats
 *
 * @ORM\Table(name="server_users_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\ServerUsersStatsRepository")
 */

class ServerUsersStats
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\Column(name="date_save", type="twake_datetime")
     */
    private $datesave;

    /**
     * @var integer
     *
     * @ORM\Column(name="connected", type="integer")
     */
    private $connected;

    /**
     * @var integer
     *
     * @ORM\Column(name="event", type="integer")
     */
    private $event;

    /**
     * @var integer
     *
     * @ORM\Column(name="files", type="integer")
     */
    private $files;

    /**
     * @var integer
     *
     * @ORM\Column(name="messages", type="integer")
     */
    private $messages;

    /**
     * @var integer
     *
     * @ORM\Column(name="tasks", type="integer")
     */
    private $tasks;

    /**
     * @var integer
     *
     * @ORM\Column(name="accounts", type="integer")
     */
    private $accounts;

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getDateSave()
    {
        return $this->datesave;
    }

    /**
     * @param mixed $datesave
     */
    public function setDateSave($datesave)
    {
        $this->datesave = $datesave;
    }

	/**
	 * @return float
	 */
	public function getConnected()
	{
		return $this->connected;
	}

	/**
	 * @param float $connected
	 */
	public function setConnected($connected)
	{
		$this->connected = $connected;
	}

    /**
     * @return int
     */
    public function getAccounts()
    {
        return $this->accounts;
    }

    /**
     * @param int $accounts
     */
    public function setAccounts($accounts)
    {
        $this->accounts = $accounts;
    }

    /**
     * @return int
     */
    public function getEvent()
    {
        return $this->event;
    }

    /**
     * @param int $event
     */
    public function setEvent($event)
    {
        $this->event = $event;
    }

    /**
     * @return int
     */
    public function getFiles()
    {
        return $this->files;
    }

    /**
     * @param int $files
     */
    public function setFiles($files)
    {
        $this->files = $files;
    }

    /**
     * @return int
     */
    public function getMessages()
    {
        return $this->messages;
    }

    /**
     * @param int $messages
     */
    public function setMessages($messages)
    {
        $this->messages = $messages;
    }

    /**
     * @return int
     */
    public function getTasks()
    {
        return $this->tasks;
    }

    /**
     * @param int $tasks
     */
    public function setTasks($tasks)
    {
        $this->tasks = $tasks;
    }

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "connected" => $this->getConnected(),
            "event" => $this->getEvent(),
            "files" => $this->getFiles(),
            "messages" => $this->getMessages(),
            "tasks" => $this->getTasks(),
            "accounts" => $this->getAccounts(),
            "datesave" => ($this->getDateSave() ? $this->getDateSave()->getTimestamp() : null)
        );
    }


}