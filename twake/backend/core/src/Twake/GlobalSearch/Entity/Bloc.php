<?php


namespace Twake\GlobalSearch\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\SearchableObject;

/**
 * Bloc
 *
 * @ORM\Table(name="bloc",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id": "ASC", "channel_id": "ASC", "id": "DESC"}, {"channel_id": "ASC"} , {"id": "ASC"} } })
 * @ORM\Entity()
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
     * @ORM\Column(name="channel_id", type="twake_uuid")
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

    public function removeMessage($message_id)
    {
        $messages = $this->getMessages();
        if (!$messages) {
            $messages = Array();
        }

        $id_messages = Array();
        $new_messages = Array();
        foreach ($messages as $index => $message) {
            if ($message) {
                if ($message["id"] != $message_id) {
                    $new_messages[] = $message;
                    $id_messages[] = $message["id"];
                }
            }
        }

        $this->setNbMessage(count($messages));
        $this->setMessages($messages);
        $this->setIdMessages($id_messages);

    }

    public function addOrUpdateMessage($message, $content, $content_id)
    {

        if (!$message) {
            return false;
        }

        $messages = $this->getMessages();
        if (!$messages) {
            $messages = Array();
        }

        $id_messages = Array();
        $message_exists = -1;
        foreach ($messages as $index => $m) {
            if ($m) {
                $id_messages[] = $m["id"];
                if ($m["id"] == $message->getId()) {
                    $message_exists = $index;
                }
            }
        }

        $reactions_tmp = $message->getReactions();
        $reactions = Array();
        foreach ($reactions_tmp as $reaction => $count) {
            $reactions[] = $reaction;
        }

        preg_match_all("/\w*-\w*-\w*-\w*-\w*/i", $content_id, $mentions_matches);
        $mentions_matches = $mentions_matches[0];
        $mentions_matches = array_unique($mentions_matches);

        $formatted_message = Array(
            "id" => $message->getId(),
            "mentions" => $mentions_matches,
            "reactions" => $reactions,
            "content" => $content,
            "sender" => $message->getSender() ? $message->getSender()->getId() . "" : null,
            "application_id" => $message->getApplicationId(),
            "date" => $message->getCreationDate()->format('Y-m-d'),
            "tags" => $message->getTags(),
            "pinned" => $message->getPinned()
        );

        if ($message_exists >= 0) {
            $messages[$index] = $formatted_message;
        } else {
            $messages[] = $formatted_message;
            $id_messages[] = $message->getId();
            $this->setNbMessage($this->getNbMessage() + 1);
        }

        $this->setNbMessage(count($messages));
        $this->setMessages($messages);
        $this->setIdMessages($id_messages);

    }

}