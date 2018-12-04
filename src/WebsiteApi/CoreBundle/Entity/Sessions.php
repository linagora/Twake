<?php

namespace WebsiteApi\CoreBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Sessions
 *
 * @ORM\Table(name="sessions",options={"collation":"utf8_bin","engine":"InnoDB"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CoreBundle\Repository\SessionsRepository")
 */
class Sessions
{

    /**
     * @ORM\Column(name="sess_id", type="blob", length=128, nullable=false)
     * @ORM\Id
     */
    private $sess_id;

    /**
     * @ORM\Column(name="sess_data", type="blob", nullable=false)
     */
    private $sess_data;

    /**
     * @ORM\Column(name="sess_time", type="cassandra_datetime", nullable=false, options={"unsigned"=true})
     */
    private $sess_time;

    /**
     * @ORM\Column(name="sess_lifetime", type="bigint", nullable=false)
     */
    private $sess_lifetime;

    /**
     * Sessions constructor.
     * @param $sess_id
     */
    public function __construct()
    {
    }

    /**
     * @return mixed
     */
    public function getSessId()
    {
        return $this->sess_id;
    }

    /**
     * @return mixed
     */
    public function getSessData()
    {
        return $this->sess_data;
    }

    /**
     * @return mixed
     */
    public function getSessTime()
    {
        return $this->sess_time;
    }

    /**
     * @return mixed
     */
    public function getSessLifetime()
    {
        return $this->sess_lifetime;
    }

}
