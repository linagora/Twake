<?php

namespace WebsiteApi\CalendarBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

    /**
     * @ORM\Column(type="integer")
     */
    private $workspaceid;


    /**
     * @ORM\Column(type="integer")
     */
    private $usemine;


    /**
     * @ORM\Column(name="from_ts", type="twake_bigint")
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="twake_bigint")
     */
    private $to;

    /**
     * @ORM\Column(type="integer")
     */
    private $user_id;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $calendarsids;

    /**
     * @ORM\Column(type="string", length=100)
     */
    private $token;

    public function __construct($workspaceid, $calendarsids, $usemine, $from, $to, $user_id)
    {
        $this->id = 0;
        $this->workspaceid = $workspaceid;
        $this->setCalendarsIds($calendarsids);
        $this->setUseMine($usemine);
        $this->setFrom($from);
        $this->setTo($to);
        $this->setUserId($user_id);
        $this->token = bin2hex(random_bytes(20));
    }

    /**
     * @return int
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }

    /**
     * @return mixed
     */
    public function getCalendarsIds()
    {
        return $this->calendarsids;
    }

    /**
     * @param mixed $calendarsids
     */
    public function setCalendarsIds($calendarsids)
    {
        $this->calendarsids = $calendarsids;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspaceid;
    }

    /**
     * @param mixed $workspaceid
     */
    public function setWorkspaceId($workspaceid)
    {
        $this->workspaceid = $workspaceid;
    }

    /**
     * @return mixed
     */
    public function getUseMine()
    {
        return $this->usemine;
    }

    /**
     * @param mixed $usemine
     */
    public function setUseMine($usemine)
    {
        $this->usemine = $usemine;
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