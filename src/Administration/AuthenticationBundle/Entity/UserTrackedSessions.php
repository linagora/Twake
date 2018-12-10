<?php

namespace Administration\AuthenticationBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Contact
 *
 * @ORM\Table(name="user_tracked_sessions",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\UserTrackedSessionsRepository")
 */
class UserTrackedSessions
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * Utilisateur associé à cette session
     *
     * @ORM\OneToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @ORM\Column(name="date", type="twake_datetime")
     */
    private $date;

    /**
     * @ORM\Column(name="session_time", type="integer")
     */
    private $session_time;

    /**
     * @ORM\Column(name="session_size", type="integer")
     */
    private $session_size;

    /**
     * @var string
     *
     * Données de la session
     * @ORM\Column(name="access_token", type="string", length=1000000)
     */

    private $data;

    public function __construct($user, $data)
    {
        $this->setData($data);

        $this->setUser($user);

        $maxtime = 0;
        $mintime = date("U");
        foreach ($data as $datum) {
            if (isset($datum["time"])) {
                $maxtime = max($maxtime, intval($datum["time"]));
                $mintime = min($mintime, intval($datum["time"]));
            }
        }
        $this->setSessionSize(count($data));
        $this->setSessionTime($maxtime - $mintime);

        $time = new \DateTime();
        $time->setTimestamp(intval($mintime));
        $this->setDate($time);
    }

    public function addData($data)
    {
        $alldata = $this->getData();
        $allData[] = $data;
        $this->setData($alldata);

        $maxtime = 0;
        $mintime = date("U");
        foreach ($alldata as $datum) {
            if (isset($datum["time"])) {
                $maxtime = max($maxtime, intval($datum["time"]));
                $mintime = min($mintime, intval($datum["time"]));
            }
        }
        $this->setSessionSize(count($alldata));
        $this->setSessionTime($maxtime - $mintime);

        $time = new \DateTime();
        $time->setTimestamp(intval($mintime));
        $this->setDate($time);
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return int
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @param int $user
     */
    public function setUser($user)
    {
        $this->user = $user;
    }

    /**
     * @return mixed
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @param mixed $date
     */
    public function setDate($date)
    {
        $this->date = $date;
    }

    /**
     * @return string
     */
    public function getData()
    {
        return json_decode($this->data, true);
    }

    /**
     * @param string $data
     */
    public function setData($data)
    {
        $this->data = json_encode($data);
    }

    /**
     * @param string $data
     */
    public function getDataAsText()
    {
        return $this->data;
    }

    /**
     * @return mixed
     */
    public function getSessionTime()
    {
        return $this->session_time;
    }

    /**
     * @param mixed $session_time
     */
    public function setSessionTime($session_time)
    {
        $this->session_time = $session_time;
    }

    /**
     * @return mixed
     */
    public function getSessionSize()
    {
        return $this->session_size;
    }

    /**
     * @param mixed $session_size
     */
    public function setSessionSize($session_size)
    {
        $this->session_size = $session_size;
    }


}
