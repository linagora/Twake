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
     * @ORM\Column(name ="nb_message", type="integer", nullable=true)
     */
    protected $nb_message = 0;

    /**
     * @ORM\Column(name ="messages", type="twake_text", nullable=true)
     */
    protected $messages;

    /**
     * @ORM\Column(name ="id_messages", type="twake_text", nullable=true)
     */
    protected $id_messages;

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
    public function __construct($workspace_id, $channel_id, $messages, $id_messages)
    {
        $this->workspace_id = $workspace_id;
        $this->channel_id = $channel_id;
        $this->messages = json_encode($messages);
        $this->id_messages = json_encode($id_messages);
    }


    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "channel_id" => $this->getChannelId(),
            "workspace_id" => $this->getWorkspaceId(),
            "nb_message" => $this->getNbMessage(),
            "messages" => $this->getMessages(),
            "id_messages" => $this->getIdMessages()

        );
        return $return;
    }

    public function getIndexationArray()
    {
        if ($this->getLock() == true) {
            $return = Array(
                "id" => $this->getId() . "",
                "channel_id" => $this->getChannelId(),
                "workspace_id" => $this->getWorkspaceId(),
                "messages" => $this->getMessages()
            );
        } else
            $return = Array();
        return $return;
    }

    /**
     * @return mixed
     */
    public function getIdMessages()
    {
        return json_decode($this->id_messages, true);
    }


    /**
     * @param mixed $id_messages
     */
    public function setIdMessages($id_messages)
    {
        $this->id_messages = json_encode($id_messages);
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
        return json_decode($this->messages, true);
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

    public function addmessage($message_entity, $content, $content_id)
    {

        $messages = $this->getMessages();
        $date = $message_entity->getCreationDate();
        $tags = $message_entity->getTags();
        $pinned = $message_entity->getPinned();

        $reactions_tmp = $message_entity->getReactions();
        $reactions = Array();
        foreach ($reactions_tmp as $reaction => $count) {
            $reactions[] = $reaction;
        }

        preg_match_all("/\w*-\w*-\w*-\w*-\w*/i", $content_id, $matches);
        $matches = $matches[0];
        $matches = array_unique($matches);

        if ($message_entity->getSender()) {
            $sender = $message_entity->getSender()->getId() . "";
        } else {
            $sender = null;
        }

        $application_id = $message_entity->getApplicationId();

        $add = Array(
            "content" => $content,
            "sender" => $sender,
            "application_id" => $application_id,
            "mentions" => $matches,
            "date" => $date->format('Y-m-d'),
            "reactions" => $reactions,
            "tags" => $tags,
            "pinned" => $pinned
        );

        if (!$messages) $messages = Array();
        array_push($messages, $add);
        $this->setMessages($messages);
        $this->setNbMessage($this->getNbMessage() + 1);

        $id_messages = $this->getIdMessages();
        if (!$id_messages) $id_messages = Array();
        $id = $message_entity->getId() . "";
        array_push($id_messages, $id);
        $this->setIdMessages($id_messages);
    }

}