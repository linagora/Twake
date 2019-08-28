<?php


namespace WebsiteApi\GlobalSearchBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use WebsiteApi\CoreBundle\Entity\SearchableObject;

/**
 * Bloc
 *
 * @ORM\Table(name="bloc",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id": "ASC", "channel_id": "ASC", "id": "DESC"}, {"channel_id": "ASC"} , {"id": "ASC"} } })
 * @ORM\Entity(repositoryClass="WebsiteApi\GlobalSearchBundle\Repository\BlocRepository")
 */
class Bloc extends SearchableObject
{

    protected $es_type = "message_bloc";

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
     * @ORM\Column(name="min_message_id", type="twake_timeuuid", nullable=true)
     */
    protected $min_message_id;
    /**
     * @ORM\Column(name="max_message_id", type="twake_timeuuid", nullable=true)
     */
    protected $max_message_id;

    /**
     * @ORM\Column(name="min_date", type="twake_datetime", nullable=true)
     */
    protected $min_date;

    /**
     * @ORM\Column(name="max_date", type="twake_datetime", nullable=true)
     */
    protected $max_date;
    /**
     * @ORM\Column(name ="nb_message", type="integer", nullable=true)
     */
    protected $nb_message = 0;
    /**
     * @ORM\Column(name ="content", type="twake_text", nullable=true)
     */
    protected $content;

    /**
     * @ORM\Column(name ="messages", type="twake_text", nullable=true)
     */
    protected $messages;

    /**
     * @ORM\Column(name ="reactions", type="twake_text", nullable=true)
     */
    protected $reactions;

    /**
     * @ORM\Column(name ="lock", type="twake_boolean")
     */
    protected $lock = false;


    /**
     * Bloc constructor.
     * @param string $workspace_id
     * @param string $channel_id
     * @param int $nb_message
     * @param $content_keywords
     */
    public function __construct($workspace_id, $channel_id, $content, $messages, $reactions)
    {
        $this->workspace_id = $workspace_id;
        $this->channel_id = $channel_id;
        $this->content = json_encode($content);
        $this->messages = json_encode($messages);
        $this->reactions = json_encode($reactions);

    }


    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "channel_id" => $this->getChannelId(),
            "workspace_id" => $this->getWorkspaceId(),
            "min_message_id" => $this->getMinMessageId(),
            "min_date" => $this->getMinDate(),
            "max_message_id" => $this->getMaxMessageId(),
            "max_date" => $this->getMaxDate(),
            "nb_message" => $this->getNbMessage(),
            "content" => $this->getContent(),
            "reactions" => $this->getReactions(),

        );
        return $return;
    }

    public function getIndexationArray()
    {
        if($this->getLock() == true){
            $return = Array(
                "id" => $this->getId()."",
                "channel_id" => $this->getChannelId(),
                "workspace_id" => $this->getWorkspaceId(),
                "date_first" => ($this->getMinDate() ? $this->getMinDate()->format('Y-m-d') : null),
                "date_last" => ($this->getMaxDate() ? $this->getMaxDate()->format('Y-m-d') : null),
                "content" => $this->getContent(),
                "reactions" => $this->getReactions(),
            );
        }
        else
            $return = Array();
        return $return;
    }

    /**
     * @return mixed
     */
    public function getReactions()
    {
        return json_decode($this->reactions,true);
    }

    /**
     * @param mixed $reaction
     */
    public function setReactions($reactions)
    {
        $this->reactions = json_encode($reactions);
    }

    /**
     * @return mixed
     */
    public function getMinDate()
    {
        return $this->min_date;
    }

    /**
     * @param mixed $min_date
     */
    public function setMinDate($min_date)
    {
        $this->min_date = $min_date;
    }

    /**
     * @return mixed
     */
    public function getMaxDate()
    {
        return $this->max_date;
    }

    /**
     * @param mixed $max_date
     */
    public function setMaxDate($max_date)
    {
        $this->max_date = $max_date;
    }


    /**
     * @return string
     */
    public function getEsType()
    {
        return $this->es_type;
    }

    /**
     * @return mixed
     */
    public function getMessages()
    {
        return json_decode($this->messages);
    }

    /**
     * @param mixed $messages
     */
    public function setMessages($messages)
    {
        $this->messages = json_encode($messages);
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
    public function getLock()
    {
        return $this->lock;
    }

    /**
     * @param mixed $lock
     */
    public function setLock($lock)
    {
        $this->lock = $lock;
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
    public function getContent()
    {
        return json_decode($this->content);
    }

    /**
     * @param mixed $content
     */
    public function setContent($content)
    {
        $this->content = json_encode($content);
    }

    public function addmessage($message,$message_id){
        $content = $this->getContent();
        array_push($content ,$message);
        $this->setContent($content);
        $this->setNbMessage($this->getNbMessage()+1);

        $ids = $this->getMessages();
        array_push($ids,$message_id);
        $this->setMessages($ids);
        }


}