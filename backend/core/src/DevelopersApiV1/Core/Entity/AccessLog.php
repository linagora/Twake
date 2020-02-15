<?php

namespace DevelopersApiV1\Core\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * AccessLog
 *
 * @ORM\Table(name="access_log",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class AccessLog
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(type="integer")
     */
    private $appid;

    /**
     * @ORM\Column(type="integer")
     */
    private $minutes;

    /**
     * @ORM\Column(type="integer")
     */
    private $readaccesscount;

    /**
     * @ORM\Column(type="integer")
     */
    private $writeaccesscount;

    /**
     * @ORM\Column(type="integer")
     */
    private $manageaccesscount;

    /**
     * @return mixed
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
    public function getAppId()
    {
        return $this->appid;
    }

    /**
     * @param mixed $appid
     */
    public function setAppId($appid)
    {
        $this->appid = $appid;
    }

    /**
     * @return mixed
     */
    public function getMinutes()
    {
        return $this->minutes;
    }

    /**
     * @param mixed $minutes
     */
    public function setMinutes($minutes)
    {
        $this->minutes = $minutes;
    }

    /**
     * @return mixed
     */
    public function getReadAccessCount()
    {
        return $this->readaccesscount;
    }

    /**
     */
    public function readAccessIncrease()
    {
        $this->readAccessCount++;
    }

    /**
     * @return mixed
     */
    public function getWriteAccessCount()
    {
        return $this->writeaccesscount;
    }

    /**
     */
    public function writeAccessIncrease()
    {
        $this->writeAccessCount++;
    }

    /**
     * @return mixed
     */
    public function getManageAccessCount()
    {
        return $this->manageaccesscount;
    }

    /**
     */
    public function manageAccessIncrease()
    {
        $this->manageAccessCount++;
    }

    /**
     * @param mixed $readaccesscount
     */
    public function setReadAccessCount($readaccesscount)
    {
        $this->readaccesscount = $readaccesscount;
    }


    /**
     * @param mixed $writeaccesscount
     */
    public function setWriteAccessCount($writeaccesscount)
    {
        $this->writeaccesscount = $writeaccesscount;
    }

    /**
     * @param mixed $manageaccesscount
     */
    public function setManageAccessCount($manageaccesscount)
    {
        $this->manageaccesscount = $manageaccesscount;
    }

    public function clear($minutes)
    {
        $this->setMinutes($minutes);
        $this->setReadAccessCount(0);
        $this->setWriteAccessCount(0);
        $this->setManageAccessCount(0);
    }

    public function __construct()
    {
        $this->setId(0);
        $this->setAppId(0);
        $this->setMinutes(0);
        $this->setReadAccessCount(0);
        $this->setWriteAccessCount(0);
        $this->setManageAccessCount(0);
    }
}
