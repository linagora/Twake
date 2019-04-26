<?php

namespace WebsiteApi\CoreBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

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
        $this->front_id = bin2hex(random_bytes(20));
    }

    /**
     * @return mixed
     */
    public function getFrontId()
    {
        return $this->front_id;
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
