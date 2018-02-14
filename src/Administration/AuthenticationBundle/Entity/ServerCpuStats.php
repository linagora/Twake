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




}