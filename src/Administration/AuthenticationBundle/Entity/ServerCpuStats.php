<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:22
 */

namespace Administration\AuthenticationBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * WorkspaceStats
 *
 * @ORM\Table(name="server_cpu_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\ServerCpuStatsRepository")
 */

class ServerCpuStats
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
     * @var string
     *
     * @ORM\Column(name="cpu", type="string", length=256)
     */
    private $cpu;

    /**
     * @var float
     *
     * @ORM\Column(name="usr", type="float")
     */
    private $usr;

    /**
     * @var float
     *
     * @ORM\Column(name="nice", type="float")
     */
    private $nice;

    /**
     * @var float
     *
     * @ORM\Column(name="sys", type="float")
     */
    private $sys;

    /**
     * @var float
     *
     * @ORM\Column(name="iowait", type="float")
     */
    private $iowait;

    /**
     * @var float
     *
     * @ORM\Column(name="irq", type="float")
     */
    private $irq;

    /**
     * @var float
     *
     * @ORM\Column(name="soft", type="float")
     */
    private $soft;

    /**
     * @var float
     *
     * @ORM\Column(name="steal", type="float")
     */
    private $steal;

    /**
     * @var float
     *
     * @ORM\Column(name="guest", type="float")
     */
    private $guest;

    /**
     * @var float
     *
     * @ORM\Column(name="gnice", type="float")
     */
    private $gnice;

    /**
     * @var float
     *
     * @ORM\Column(name="idle", type="float")
     */
    private $idle;

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
    public function getCpu()
    {
        return $this->cpu;
    }

    /**
     * @param mixed $cpu
     */
    public function setCpu($cpu)
    {
        $this->cpu = $cpu;
    }

    /**
     * @return float
     */
    public function getUsr()
    {
        return $this->usr;
    }

    /**
     * @param float $usr
     */
    public function setUsr($usr)
    {
        $this->usr = $usr;
    }

    /**
     * @return float
     */
    public function getNice()
    {
        return $this->nice;
    }

    /**
     * @param float $nice
     */
    public function setNice($nice)
    {
        $this->nice = $nice;
    }

    /**
     * @return float
     */
    public function getSys()
    {
        return $this->sys;
    }

    /**
     * @param float $sys
     */
    public function setSys($sys)
    {
        $this->sys = $sys;
    }

    /**
     * @return float
     */
    public function getIowait()
    {
        return $this->iowait;
    }

    /**
     * @param float $iowait
     */
    public function setIowait($iowait)
    {
        $this->iowait = $iowait;
    }

    /**
     * @return float
     */
    public function getIrq()
    {
        return $this->irq;
    }

    /**
     * @param float $irq
     */
    public function setIrq($irq)
    {
        $this->irq = $irq;
    }

    /**
     * @return float
     */
    public function getSoft()
    {
        return $this->soft;
    }

    /**
     * @param float $soft
     */
    public function setSoft($soft)
    {
        $this->soft = $soft;
    }

    /**
     * @return float
     */
    public function getSteal()
    {
        return $this->steal;
    }

    /**
     * @param float $steal
     */
    public function setSteal($steal)
    {
        $this->steal = $steal;
    }

    /**
     * @return float
     */
    public function getGuest()
    {
        return $this->guest;
    }

    /**
     * @param float $guest
     */
    public function setGuest($guest)
    {
        $this->guest = $guest;
    }

    /**
     * @return float
     */
    public function getGnice()
    {
        return $this->gnice;
    }

    /**
     * @param float $gnice
     */
    public function setGnice($gnice)
    {
        $this->gnice = $gnice;
    }

    /**
     * @return float
     */
    public function getIdle()
    {
        return $this->idle;
    }

    /**
     * @param float $idle
     */
    public function setIdle($idle)
    {
        $this->idle = $idle;
    }
    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "cpu" => $this->getCpu(),
            "datesave" => $this->getDateSave(),
            "gnice" => $this->getGnice(),
            "idle" => $this->getIdle(),
            "guest" => $this->getGuest(),
            "iowait" => $this->getIowait(),
            "irq" => $this->getIrq(),
            "nice" => $this->getNice(),
            "soft" => $this->getSoft(),
            "steal" => $this->getSteal(),
            "sys" => $this->getSys(),
            "usr" => $this->getUsr(),
        );
    }
}