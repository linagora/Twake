<?php

namespace Administration\AuthenticationBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
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
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var int
     *
     * Utilisateur associé à cette session
     *
     * @ORM\OneToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @ORM\Column(name="date", type="datetime")
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
     * @ORM\Column(name="accessToken", type="string", length=1000000)
     */

    private $data;

    public function __construct($user, $data)
    {
        $this->setData($data);

        $this->setUser($user);

        $maxTime = 0;
        $minTime = date("U");
        foreach ($data as $datum) {
            if (isset($datum["time"])) {
                $maxTime = max($maxTime, intval($datum["time"]));
                $minTime = min($minTime, intval($datum["time"]));
            }
        }
        $this->setSessionSize(count($data));
        $this->setSessionTime($maxTime - $minTime);

        $time = new \DateTime();
        $time->setTimestamp(intval($minTime));
        $this->setDate($time);
    }

    public function addData($data)
    {
        $allData = $this->getData();
        $allData[] = $data;
        $this->setData($allData);

        $maxTime = 0;
        $minTime = date("U");
        foreach ($allData as $datum) {
            if (isset($datum["time"])) {
                $maxTime = max($maxTime, intval($datum["time"]));
                $minTime = min($minTime, intval($datum["time"]));
            }
        }
        $this->setSessionSize(count($allData));
        $this->setSessionTime($maxTime - $minTime);

        $time = new \DateTime();
        $time->setTimestamp(intval($minTime));
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
