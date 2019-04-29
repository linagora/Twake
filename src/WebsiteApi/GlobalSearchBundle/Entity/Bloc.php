<?php


namespace WebsiteApi\GlobalSearchBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use WebsiteApi\CoreBundle\Entity\SearchableObject;

/**
 * Bloc
 *
 * @ORM\Table(name="bloc",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id": "ASC", "channel_id": "ASC", "id": "DESC"}, {"id": "ASC"} } })
 * @ORM\Entity(repositoryClass="WebsiteApi\GlobalSearchBundle\Repository\BlocRepository")
 */
class Bloc extends SearchableObject
{

    protected $es_type = "bloc";

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;
    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $workspace_id;
    /**
     * @ORM\Column(name="channel_id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $channel_id;
    /**
     * @ORM\Column(name="min_message_id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $min_message_id;
    /**
     * @ORM\Column(name="max_message_id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $max_message_id;
    /**
     * @ORM\Column(name ="nb_message", type="twake_timeuuid", nullable=true)
     */
    protected $nb_message;
    /**
     * @ORM\Column(name ="content_keywords", type="integer", nullable=true)
     */
    protected $content_keywords;

    /**
     * Bloc constructor.
     * @param string $workspace_id
     * @param string $channel_id
     * @param string $min_message_id
     * @param string $max_message_id
     * @param int $nb_message
     * @param $content_keywords
     */
    public function __construct($workspace_id, $channel_id, $min_message_id, $max_message_id, $nb_message, $content_keywords)
    {
        $this->workspace_id = $workspace_id;
        $this->channel_id = $channel_id;
        $this->min_message_id = $min_message_id;
        $this->max_message_id = $max_message_id;
        $this->nb_message = $nb_message;
        $this->content_keywords = $content_keywords;
    }


    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "channel_id" => $this->getChannelId(),
            "workspace_id" => $this->getWorkspaceId(),
            "min_message_id" => $this->getMinMessageId(),
            "max_message_id" => $this->getMaxMessageId(),
            "nb_message" => $this->getNbMessage(),
            "content_keyword" => $this->getContentKeywords(),
        );
        return $return;
    }

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
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @param mixed $workspace_id
     */
    public function setWorkspaceId($workspace_id)
    {
        $this->workspace_id = $workspace_id;
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
    public function getMinMessageId()
    {
        return $this->min_message_id;
    }

    /**
     * @param mixed $min_message_id
     */
    public function setMinMessageId($min_message_id)
    {
        $this->min_message_id = $min_message_id;
    }

    /**
     * @return mixed
     */
    public function getMaxMessageId()
    {
        return $this->max_message_id;
    }

    /**
     * @param mixed $max_message_id
     */
    public function setMaxMessageId($max_message_id)
    {
        $this->max_message_id = $max_message_id;
    }

    /**
     * @return mixed
     */
    public function getNbMessage()
    {
        return $this->nb_message;
    }

    /**
     * @param mixed $nb_message
     */
    public function setNbMessage($nb_message)
    {
        $this->nb_message = $nb_message;
    }

    /**
     * @return mixed
     */
    public function getContentKeywords()
    {
        return $this->content_keywords;
    }

    /**
     * @param mixed $content_keywords
     */
    public function setContentKeywords($content_keywords)
    {
        $this->content_keywords = $content_keywords;
    }



}