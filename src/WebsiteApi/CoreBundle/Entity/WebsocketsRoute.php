<?php

namespace WebsiteApi\CoreBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * WebsocketsRoutes
 *
 * @ORM\Table(name="websockets_route",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CoreBundle\Repository\WebsocketsRouteRepository")
 */
class WebsocketsRoute
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\Column(type="twake_datetime", options={"default" : "1970-01-02"})
     */
    private $last_access_date;

    /**
     * @ORM\Column(name="route", type="string", length=512)
     */
    private $route;

    /**
     * @ORM\Column(name="route_random_endpoint", type="twake_text", length=2000)
     */
    private $route_random_endpoint;

    /**
     * @ORM\Column(name="key", type="twake_text", length=2000)
     */
    private $key;

    /**
     * @ORM\Column(name="key_version", type="integer")
     */
    private $key_version = 0;

    /**
     * @ORM\Column(name="date", type="twake_text", length=2000)
     */
    private $data;

    /**
     * WebsocketsRoute constructor.
     * @param $id
     */
    public function __construct()
    {
        $this->route_random_endpoint = bin2hex(random_bytes(30));
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
    public function getLastAccessDate()
    {
        return $this->last_access_date;
    }

    /**
     * @param mixed $last_access_date
     */
    public function setLastAccessDate()
    {
        $this->last_access_date = new \DateTime();
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
        $this->key_version++;
        $this->key = $key;
    }

}
