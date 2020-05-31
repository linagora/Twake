<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Sessions
 *
 * @ORM\Table(name="twake_sessions",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class Sessions
{

    /**
     * @ORM\Column(name="sess_id", type="twake_string", length=128, nullable=false)
     * @ORM\Id
     */
    private $sess_id;

    /**
     * @ORM\Column(name="sess_data", type="twake_text", nullable=false)
     */
    private $sess_data;

    /**
     * @ORM\Column(name="sess_time", type="twake_bigint", nullable=false, options={"unsigned"=true})
     */
    private $sess_time;

    /**
     * @ORM\Column(name="sess_lifetime", type="twake_bigint", nullable=false)
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

    /**
     * @param mixed $sess_id
     */
    public function setSessId($sess_id)
    {
        $this->sess_id = $sess_id;
    }

    /**
     * @param mixed $sess_data
     */
    public function setSessData($sess_data)
    {
        $this->sess_data = $sess_data;
    }

    /**
     * @param mixed $sess_time
     */
    public function setSessTime($sess_time)
    {
        $this->sess_time = $sess_time;
    }

    /**
     * @param mixed $sess_lifetime
     */
    public function setSessLifetime($sess_lifetime)
    {
        $this->sess_lifetime = $sess_lifetime;
    }


}
