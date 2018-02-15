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
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(name="dateSave", type="datetime")
     */
    private $dateSave;

    /**
     * @var float
     *
     * @ORM\Column(name="used", type="float")
     */
    private $used;

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
        return $this->dateSave;
    }

    /**
     * @param mixed $dateSave
     */
    public function setDateSave($dateSave)
    {
        $this->dateSave = $dateSave;
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




}