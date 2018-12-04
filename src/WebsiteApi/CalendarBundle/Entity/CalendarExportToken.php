<?php

namespace WebsiteApi\CalendarBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

/**
 * Event
 *
 * @ORM\Table(name="calendar_export_token",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\CalendarExportTokenRepository")
 */

class CalendarExportToken {

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(type="integer")
     */
    private $workspaceId;


    /**
     * @ORM\Column(type="integer")
     */
    private $useMine;


    /**
     * @ORM\Column(name="from_ts", type="bigint")
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="bigint")
     */
    private $to;

    /**
     * @ORM\Column(type="integer")
     */
    private $user_id;

    /**
     * @ORM\Column(type="string", length=10)
     */
    private $calendarsIds;

    /**
     * @ORM\Column(type="string", length=100)
     */
    private $token;

    public  function __construct($workspaceId,$calendarsIds,$useMine,$from,$to, $user_id)
    {
        $this->id = 0;
        $this->workspaceId = $workspaceId;
        $this->setCalendarsIds($calendarsIds);
        $this->setUseMine($useMine);
        $this->setFrom($from);
        $this->setTo($to);
        $this->setUserId($user_id);
        $this->token = bin2hex(random_bytes(20));
    }

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
    public function getCalendarsIds()
    {
        return $this->calendarsIds;
    }

    /**
     * @param mixed $calendarsIds
     */
    public function setCalendarsIds($calendarsIds)
    {
        $this->calendarsIds = $calendarsIds;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspaceId;
    }

    /**
     * @param mixed $workspaceId
     */
    public function setWorkspaceId($workspaceId)
    {
        $this->workspaceId = $workspaceId;
    }

    /**
     * @return mixed
     */
    public function getUseMine()
    {
        return $this->useMine;
    }

    /**
     * @param mixed $useMine
     */
    public function setUseMine($useMine)
    {
        $this->useMine = $useMine;
    }

    /**
     * @return mixed
     */
    public function getFrom()
    {
        return $this->from;
    }

    /**
     * @param mixed $from
     */
    public function setFrom($from)
    {
        $this->from = $from;
    }

    /**
     * @return mixed
     */
    public function getTo()
    {
        return $this->to;
    }

    /**
     * @param mixed $to
     */
    public function setTo($to)
    {
        $this->to = $to;
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @param mixed $user_id
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->token;
    }

    /**
     * @param mixed $token
     */
    public function setToken($token)
    {
        $this->token = $token;
    }


}