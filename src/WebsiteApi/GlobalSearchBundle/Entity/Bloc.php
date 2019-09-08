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
            "id_messages" =>$this->getIdMessages()

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
                "messages" => $this->getMessages()
            );
        }
        else
            $return = Array();
        return $return;
    }

    /**
     * @return mixed
     */
    public function getIdMessages()
    {
        return json_decode($this->id_messages,true);
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
        return json_decode($this->messages,true);
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

    public function addmessage($message_entity, $message_system_service = null)
    {

        $messages = $this->getMessages();
        $content = $this->mdToText($message_entity->getContent());
        $date = $message_entity->getCreationDate();
        $tags = $message_entity->getTags();
        $pinned = $message_entity->getPinned();

        if ($message_system_service) {
            $message_as_text = $message_system_service->mdToText($message_entity->getContent());
        }

        if ($message_entity->getSender()) {
            $sender = $message_entity->getSender()->getId() . "";
        } else {
            $sender = null;
        }

        $application_id = $message_entity->getApplicationId();

        $mentions = Array();

        if (!is_string($message_entity->getContent()) && isset($message_entity->getContent()["prepared"]) && is_array($message_entity->getContent()["prepared"][0])) {
            foreach ($message_entity->getContent()["prepared"][0] as $elem) {
                if (is_array($elem) && is_string($elem["content"])) {
                    $id = explode(":", $elem["content"])[1];
                    //error_log(print_r($id,true));
                    $mentions[] = $id;
                }
            }
            $mentions = array_unique($mentions);
            //error_log(print_r($mentions,true));
        }


        $add = Array(
            "content" => $content,
            "sender" => $sender,
            "application_id" => $application_id,
            "mentions" => $mentions,
            "date" => $date->format('Y-m-d'),
            "reactions" => Array(),
            "tags" => $tags,
            "pinned" => $pinned

        );

        if (!$messages) $messages = Array();
        array_push($messages, $add);
        $this->setMessages($messages);
        $this->setNbMessage($this->getNbMessage()+1);

        $id_messages = $this->getIdMessages();
        if (!$id_messages) $id_messages = Array();
        $id= $message_entity->getId()."";
        array_push( $id_messages, $id);
        $this->setIdMessages($id_messages);
    }

    private function mdToText($array)
    {

        if (!$array) {
            return "";
        }

        if (is_string($array)) {
            $array = [$array];
        }

        if (isset($array["fallback_string"])) {
            $result = $array["fallback_string"];
        } else if (isset($array["original_str"])) {
            $result = $array["original_str"];
        } else {

            if (isset($array["type"]) || isset($array["start"])) {
                $array = [$array];
            }

            $result = "";

            try {
                foreach ($array as $item) {
                    if (is_string($item)) {
                        $result .= $item;
                    } else if (isset($item["type"])) {
                        if (in_array($item["type"], Array("underline", "strikethrough", "bold", "italic", "mquote", "quote", "email", "url", "", "nop", "br", "system"))) {
                            if ($item["type"] == "br") {
                                $result .= " ";
                            }
                            $result .= $this->mdToText($item["content"]);
                        }
                    } else {
                        $result .= $this->mdToText($item["content"]);
                    }
                }

            } catch (\Exception $e) {
                return "Open Twake to see this message.";
            }

        }


        $result = preg_replace("/@(.*):.*(( |$))/", "@$1$2", $result);
        $result = preg_replace("/#(.*):.*(( |$))/", "#$1$2", $result);

        return $result;

    }


}