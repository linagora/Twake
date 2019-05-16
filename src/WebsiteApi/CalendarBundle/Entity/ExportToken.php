<?php


namespace WebsiteApi\CalendarBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

/**
 * ExportToken
 *
 * @ORM\Table(name="export_token",options={"engine":"MyISAM", "scylladb_keys": {{"user_id": "ASC", "id": "ASC"},{"user_token": "ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\ExportTokenRepository")
 */
class ExportToken
{
    /**
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $user_id;

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="workspaceid", type="integer")
     */
    private $workspaceid;


    /**
     * @ORM\Column(name="calendars",type="twake_text")
     */
    private $calendars;

    /**
     * @ORM\Column(name="user_token", type="twake_timeuuid")
     */
    private $token;

    /**
     * ExportToken constructor.
     * @param $user_id
     * @param $workspaceid
     * @param $calendars
     * @param $token
     */
    public function __construct($user_id, $workspaceid, $calendars, $token)
    {
        $this->user_id = $user_id;
        $this->workspaceid = $workspaceid;
        $this->setCalendars($calendars);
        $this->token = $token;
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @param mixed $user_id
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceid()
    {
        return $this->workspaceid;
    }

    /**
     * @param mixed $workspaceid
     */
    public function setWorkspaceid($workspaceid)
    {
        $this->workspaceid = $workspaceid;
    }

    /**
     * @return mixed
     */
    public function getCalendars()
    {
        return json_decode($this->calendars, true);
    }

    /**
     * @param mixed $calendars
     */
    public function setCalendars($calendars)
    {
        $this->calendars = json_encode($calendars);
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->token;
    }

    /**
     * @param mixed $token
     */
    public function setToken($token)
    {
        $this->token = $token;
    }




}