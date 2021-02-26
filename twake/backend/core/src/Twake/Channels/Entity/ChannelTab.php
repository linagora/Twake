<?php

namespace Twake\Channels\Entity;

use Doctrine\ORM\Mapping as ORM;


use Twake\Core\Entity\FrontObject;
use Twake\Core\Services\DoctrineAdapter\FakeCassandraTimeuuid;

/**
 * Channel
 *
 * @ORM\Table(name="channel_tab",options={"engine":"MyISAM", "scylladb_keys": {{"channel_id":"ASC", "app_id":"ASC", "id":"ASC"}, {"id":"ASC"}} })
 * @ORM\Entity()
 */
class ChannelTab extends FrontObject
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="channel_id", type="twake_uuid")
     * @ORM\Id
     */
    private $channel_id;

    /**
     * @ORM\Column(name="app_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $app_id;

    /**
     * @ORM\Column(name="name", type="twake_text", nullable=true)
     */
    private $name = "";

    /**
     * @ORM\Column(name="configuration", type="twake_text", nullable=true)
     */
    private $configuration = "{}";


    public function __construct()
    {
        parent::__construct();
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "app_id" => $this->getAppId(),
            "channel_id" => $this->getChannelId(),
            "name" => $this->getName(),
            "configuration" => $this->getConfiguration()
        );
    }

    /**
     * @return mixed
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
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return mixed
     */
    public function getAppId()
    {
        return $this->app_id;
    }

    /**
     * @param mixed $app_id
     */
    public function setAppId($app_id)
    {
        $this->app_id = $app_id;
    }

    /**
     * @return mixed
     */
    public function getChannelId()
    {
        return $this->channel_id;
    }

    /**
     * @param mixed $channel_id
     */
    public function setChannelId($channel_id)
    {
        $this->channel_id = $channel_id;
    }

    /**
     * @return mixed
     */
    public function getConfiguration()
    {
        return json_decode($this->configuration, true);
    }

    /**
     * @param mixed $configuration
     */
    public function setConfiguration($configuration)
    {
        $this->configuration = json_encode($configuration);
    }


}
