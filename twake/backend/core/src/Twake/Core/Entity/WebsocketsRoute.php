<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * WebsocketsRoutes
 *
 * @ORM\Table(name="websockets_route",options={"engine":"MyISAM", "indexes":{@ORM\Index(columns={"route"})}})
 * @ORM\Entity
 */
class WebsocketsRoute
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(type="twake_datetime", options={"default" : "1970-01-02"})
     */
    private $last_modified_date;

    /**
     * @ORM\Column(name="route", type="string", length=512)
     */
    private $route;

    /**
     * @ORM\Column(name="route_random_endpoint", type="twake_no_salt_text", length=2000)
     */
    private $route_random_endpoint;

    /**
     * @ORM\Column(name="route_key", type="twake_text", length=2000)
     */
    private $key = "";

    /**
     * @ORM\Column(name="key_version", type="string", length=64)
     */
    private $key_version = "0";

    /**
     * @ORM\Column(name="data", type="twake_text", length=2000)
     */
    private $data;

    /**
     * WebsocketsRoute constructor.
     * @param $id
     */
    public function __construct()
    {
        $this->route_random_endpoint = date("U") . "-" . bin2hex(random_bytes(30));
    }

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
    public function getRoute()
    {
        return $this->route;
    }

    /**
     * @param mixed $route
     */
    public function setRoute($route)
    {
        $this->route = $route;
    }

    /**
     * @return mixed
     */
    public function getRouteRandomEndpoint()
    {
        return $this->route_random_endpoint;
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        return json_decode($this->data, 1);
    }

    /**
     * @param mixed $data
     */
    public function setData($data)
    {
        $this->data = json_encode($data);
    }

    /**
     * @return mixed
     */
    public function getLastModifiedDate()
    {
        return $this->last_modified_date;
    }

    /**
     * @param mixed $last_modified_date
     */
    public function setLastModifiedDate()
    {
        $this->last_modified_date = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * @param mixed $key
     */
    public function setKey($key)
    {
        $this->key = $key;
    }

    /**
     * @return mixed
     */
    public function getKeyVersion()
    {
        return $this->key_version;
    }

    /**
     * @param mixed $key_version
     */
    public function setKeyVersion($key_version)
    {
        $this->key_version = $key_version;
    }


}
