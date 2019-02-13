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
 * @ORM\Table(name="server_ram_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\ServerRamStatsRepository")
 */

class ServerRamStats
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

    /**
     * @ORM\Column(name="date_save", type="twake_datetime")
     */
    private $datesave;

    /**
     * @var float
     *
     * @ORM\Column(name="used", type="twake_float")
     */
    private $used;

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
     * @return mixed
     */
    public function getUsed()
    {
        return $this->used;
    }

    /**
     * @param mixed $used
     */
    public function setUsed($used)
    {
        $this->used = $used;
    }

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "used" => $this->getUsed(),
            "datesave" => $this->getDateSave()
        );
    }


}