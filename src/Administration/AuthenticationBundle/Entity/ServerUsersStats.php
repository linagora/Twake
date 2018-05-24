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
 * @ORM\Table(name="server_users_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\ServerUsersStatsRepository")
 */

class ServerUsersStats
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
     * @var integer
     *
     * @ORM\Column(name="connected", type="integer")
     */
    private $connected;

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
	 * @return float
	 */
	public function getConnected()
	{
		return $this->connected;
	}

	/**
	 * @param float $connected
	 */
	public function setConnected($connected)
	{
		$this->connected = $connected;
	}



    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "connected" => $this->getConnected(),
            "datesave" => ($this->getDateSave() ? $this->getDateSave()->getTimestamp() : null)
        );
    }


}