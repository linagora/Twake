<?php

namespace DevelopersApiV1\CoreBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * AccessLog
 *
 * @ORM\Table(name="access_log",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="DevelopersApiV1\CoreBundle\Repository\AccessLogRepository")
 */
class AccessLog
{
	/**
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	private $id;

    /**
     * @ORM\Column(type="integer")
     */
	private $appId;

    /**
     * @ORM\Column(type="integer")
     */
	private $minutes;

    /**
     * @ORM\Column(type="integer")
     */
    private $readAccessCount;

    /**
     * @ORM\Column(type="integer")
     */
    private $writeAccessCount;

    /**
     * @ORM\Column(type="integer")
     */
    private $manageAccessCount;

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getAppId()
    {
        return $this->appId;
    }

    /**
     * @param mixed $appId
     */
    public function setAppId($appId)
    {
        $this->appId = $appId;
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
        return $this->readAccessCount;
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
        return $this->writeAccessCount;
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
        return $this->manageAccessCount;
    }

    /**
     */
    public function manageAccessIncrease()
    {
        $this->manageAccessCount++;
    }
    /**
     * @param mixed $readAccessCount
     */
    public function setReadAccessCount($readAccessCount)
    {
        $this->readAccessCount = $readAccessCount;
    }


    /**
     * @param mixed $writeAccessCount
     */
    public function setWriteAccessCount($writeAccessCount)
    {
        $this->writeAccessCount = $writeAccessCount;
    }

    /**
     * @param mixed $manageAccessCount
     */
    public function setManageAccessCount($manageAccessCount)
    {
        $this->manageAccessCount = $manageAccessCount;
    }

    public function clear($minutes){
        $this->setMinutes($minutes);
        $this->setReadAccessCount(0);
        $this->setWriteAccessCount(0);
        $this->setManageAccessCount(0);
    }

    public function __construct(){
        $this->setId(0);
        $this->setAppId(0);
        $this->setMinutes(0);
        $this->setReadAccessCount(0);
        $this->setWriteAccessCount(0);
        $this->setManageAccessCount(0);
    }
}
