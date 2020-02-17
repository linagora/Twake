<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * @ORM\MappedSuperclass
 */
class FrontObject
{

    /**
     * @ORM\Column(name="front_id", type="string", length=80)
     */
    protected $front_id = "";

    public function __construct()
    {
        $this->front_id = date("U") . bin2hex(random_bytes(20));
    }

    public function getId()
    {
        return "";
    }

    /**
     * @return mixed
     */
    public function getFrontId()
    {
        return $this->front_id ? $this->front_id : $this->getId();
    }

    /**
     * @param mixed $front_id
     */
    public function setFrontId($front_id)
    {
        if ($front_id) {
            $this->front_id = $front_id;
        }
    }

}
