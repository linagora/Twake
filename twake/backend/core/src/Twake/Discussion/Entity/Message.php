<?php

namespace Twake\Discussion\Entity;

use Doctrine\ORM\Mapping as ORM;


use Twake\Core\Entity\FrontObject;

/**
 * Message
 *
 * @ORM\Table(name="message",options={"engine":"MyISAM", "scylladb_keys": {{"channel_id":"ASC", "parent_message_id":"ASC", "id":"DESC"}, {"id":"ASC"}} })
 * @ORM\Entity()
 */
class Message extends FrontObject
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
     * @ORM\Column(name="parent_message_id", type="twake_no_salt_text")
     * @ORM\Id
     */
    private $parent_message_id = "";

    /**
     * @ORM\Column(name="responses_count", type="integer")
     */
    private $responses_count = 0;

    /**
     * @ORM\Column(name="message_type", type="integer")
     */
    private $message_type = 0; //0 from user, 1 from application, 2 from system

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Users\Entity\User",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $sender = null;

    /**
     * @ORM\Column(name="application_id", type="twake_no_salt_text", nullable=true)
     */
    private $application_id = null;


    /**
     * @ORM\Column(name="creation_date", type="twake_datetime", nullable=true)
     */
    private $creation_date;

    /**
     * @ORM\Column(name="modification_date", type="twake_datetime", nullable=true)
     */
    private $modification_date;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $edited = false;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $pinned = false;

    /**
     * @ORM\Column(name="hidden_data", type="twake_text")
     */
    private $hidden_data = "{}";

    /**
     * @ORM\Column(name="reactions", type="twake_text")
     */
    private $reactions = "{}";

    /**
     * @ORM\Column(name="content", type="twake_text")
     */
    private $content = "[]";

    /**
     * @ORM\Column(name="user_specific_content", type="twake_text")
     */
    private $user_specific_content = "[]";

    /**
     * @ORM\Column(name="tags", type="twake_text", nullable=true)
     */
    private $tags;

    /**
     * @ORM\Column(name="block_id", type="twake_timeuuid", nullable=true)
     */
    private $block_id = null;

    /**
     * @ORM\Column(name="increment_at_time", type="twake_bigint", nullable=true)
     */
    private $increment_at_time = null;

    /**
     * Message constructor.
     */

    public function __construct($channel_id, $parent_message_id, $increment_at_time = 0)
    {
        parent::__construct();
        $this->channel_id = $channel_id;
        $this->parent_message_id = $parent_message_id;
        $this->creation_date = new \DateTime();
        $this->modification_date = new \DateTime();
        $this->increment_at_time = $increment_at_time;
    }


    /**
     * @return mixed
     */
    public function getTags()
    {
        return json_decode($this->tags);
    }

    /**
     * @param mixed $tags
     */
    public function setTags($tags)
    {
        $this->tags = json_encode($tags);
    }

    /**
     * Get the value of Id
     *
     * @return mixed
     */

    public function getId()
    {
        return $this->id;
    }

    /**
     * Set the value of Id
     *
     * @param mixed id
     *
     * @return self
     */
    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    /**
     * Get the value of Channel Id
     *
     * @return mixed
     */
    public function getChannelId()
    {
        return $this->channel_id;
    }

    /**
     * Get the value of Parent Message Id
     *
     * @return mixed
     */
    public function getParentMessageId()
    {
        return $this->parent_message_id;
    }

    public function setParentMessageId($id)
    {
        $this->parent_message_id = $id;
    }

    /**
     * Get the value of Responses Count
     *
     * @return mixed
     */
    public function getResponsesCount()
    {
        return $this->responses_count;
    }

    /**
     * Set the value of Responses Count
     *
     * @param mixed responses_count
     *
     * @return self
     */
    public function setResponsesCount($responses_count)
    {
        $this->responses_count = max(0, $responses_count);

        return $this;
    }

    /**
     * Get the value of Message Type
     *
     * @return mixed
     */
    public function getMessageType()
    {
        return $this->message_type;
    }

    /**
     * Set the value of Message Type
     *
     * @param mixed message_type
     *
     * @return self
     */
    public function setMessageType($message_type)
    {
        $this->message_type = $message_type;

        return $this;
    }

    /**
     * Get the value of Sender
     *
     * @return mixed
     */
    public function getSender()
    {
        return $this->sender;
    }

    /**
     * Set the value of Sender
     *
     * @param mixed sender
     *
     * @return self
     */
    public function setSender($sender)
    {
        $this->sender = $sender;

        return $this;
    }

    /**
     * Get the value of Application
     *
     * @return mixed
     */
    public function getApplicationId()
    {
        return $this->application_id;
    }

    /**
     * Set the value of Application
     *
     * @param mixed application
     *
     * @return self
     */
    public function setApplicationId($application_id)
    {
        $this->application_id = $application_id;

        return $this;
    }

    /**
     * Get the value of Creation Date
     *
     * @return mixed
     */
    public function getCreationDate()
    {
        return $this->creation_date;
    }

    /**
     * Set the value of Creation Date
     *
     * @param mixed creation_date
     *
     * @return self
     */
    public function setCreationDate($creation_date)
    {
        $this->creation_date = $creation_date;

        return $this;
    }

    /**
     * Get the value of Modification Date
     *
     * @return mixed
     */
    public function getModificationDate()
    {
        return $this->modification_date;
    }

    /**
     * Set the value of Modification Date
     *
     * @param mixed modification_date
     *
     * @return self
     */
    public function setModificationDate($modification_date)
    {
        $this->modification_date = $modification_date;

        return $this;
    }

    /**
     * Get the value of Edited
     *
     * @return mixed
     */
    public function getEdited()
    {
        return $this->edited;
    }

    /**
     * Set the value of Edited
     *
     * @param mixed edited
     *
     * @return self
     */
    public function setEdited($edited)
    {
        $this->edited = $edited;

        return $this;
    }

    /**
     * Get the value of Pinned
     *
     * @return mixed
     */
    public function getPinned()
    {
        return $this->pinned;
    }

    /**
     * Set the value of Pinned
     *
     * @param mixed pinned
     *
     * @return self
     */
    public function setPinned($pinned)
    {
        $this->pinned = $pinned;

        return $this;
    }

    /**
     * Get the value of Hidden Data
     *
     * @return mixed
     */
    public function getHiddenData()
    {
        if (!$this->hidden_data) {
            return Array();
        }
        return json_decode($this->hidden_data, 1);
    }

    /**
     * Set the value of Hidden Data
     *
     * @param mixed hidden_data
     *
     * @return self
     */
    public function setHiddenData($hidden_data)
    {
        $this->hidden_data = json_encode($hidden_data);

        return $this;
    }

    /**
     * Get the value of Hidden Data
     *
     * @return mixed
     */
    public function getReactions()
    {
        if (!$this->reactions) {
            return Array();
        }
        return json_decode($this->reactions, 1);
    }

    /**
     * Set the value of Hidden Data
     *
     * @param mixed hidden_data
     *
     * @return self
     */
    public function setReactions($reactions)
    {
        $this->reactions = json_encode($reactions);

        return $this;
    }

    public function getContent()
    {
        return json_decode($this->content, true);
    }

    public function setContent($content)
    {
        $this->content = json_encode($content);
    }

    public function getUserSpecificContent()
    {
        return json_decode($this->user_specific_content, true);
    }

    public function setUserSpecificContent($user_specific_content)
    {
        $this->user_specific_content = json_encode($user_specific_content);
    }
    
    public function getBlockId()
    {
        return $this->block_id;
    }
    
    public function setBlockId($block_id)
    {
        $this->block_id = $block_id;
    }
    
    public function getIncrementAtTime()
    {
        return $this->increment_at_time;
    }
    
    public function setIncrementAtTime($increment_at_time)
    {
        $this->increment_at_time = $increment_at_time;
    }

    public function getMessageTypeObject() {
        switch($this->getMessageType()) {
            case 1: return Array(
                "type" => "message",
                "subtype" => "application",
            );
            case 2: return Array(
                "type" => "message",
                "subtype" => "system",
            );
            case 0:
            default:
                return Array(
                    "type" => "message",
                    "subtype" => null,
                );
        }
    }

    public function getNewApiObjectReactions($messageEntity) {
        $reactions = Array();

        if($messageEntity->getReactions() == null) return $reactions;

        $orignal_reactions_array = $messageEntity->getReactions();
        
        foreach($orignal_reactions_array as $key => $value){
            $new_reaction_object = Array(
                "name" => $value["name"] ?: $key
            );
            $new_reaction_object = array_merge($new_reaction_object, $value);
            $new_reaction_object["users"] = array_values($new_reaction_object["users"]);

            array_push($reactions, $new_reaction_object);
        }

        return $reactions;
    }

    /**
     * Set files for new api object
     */
    public function setFiles($messageEntity) {
        $files = Array();

        if(!isset($messageEntity->getContent()['files'])) return $files;
        
        $orignal_files = $messageEntity->getContent()['files'];

        foreach($orignal_files as $file){
            if($file["type"] == "file") {
                $new_file_format = Array(
                    "company_id" => "",
                    "message_id" => $messageEntity->getId(),
                    "id" => $file["content"],
                    "metadata" => Array(
                        "source" => "drive",
                        "external_id" => $file["content"]
                    ),
                );
                array_push($files, $new_file_format);
            }
        }

        return $files;
    }
    
    /**
     * Set blocks for new api object
     */
    public function setBlocks($messageEntity) {
        $blocks = Array();
        $content = $messageEntity->getContent();

        if(!isset($content)) return $blocks;

        $markdown_element = Array(
            "type" => "mrkdwn",
            "text" => isset($content['original_str']) ? $content['original_str'] : ""
        );

        $new_block_format = Array(
            "type" => "section",
            "text" => $markdown_element
        );

        array_push($blocks, $new_block_format);

        return $blocks;
    }

    /**
     * Generate new api object
     */
    public function generateNewApiObject($messageEntity, $array) {
    
        $message_type_object = $messageEntity->getMessageTypeObject();
        $api_object = Array(
            "id" => $messageEntity->getId(),
            "channel_id" => $messageEntity->getChannelId(),
            "thread_id" => $messageEntity->getParentMessageId(),
            "created_at" => ($messageEntity->getCreationDate() ? $messageEntity->getCreationDate()->getTimestamp() : null),
            "application_id" => $messageEntity->getApplicationId(),
            "user_id" => is_string($messageEntity->getSender()) ? $messageEntity->getSender() : ($messageEntity->getSender() ? $messageEntity->getSender()->getId() : null),
            "edited" => $messageEntity->getEdited(),
            "text" => isset($messageEntity->getContent()['original_str']) ? $messageEntity->getContent()['original_str'] : "", 
            "blocks" => $messageEntity->setBlocks($messageEntity),
            "files" => $messageEntity->setFiles($messageEntity),
            "context" => $messageEntity->getHiddenData(),
            "title" => $messageEntity->getHiddenData()['custom_title'] ?: null,
            "picture" => $messageEntity->getHiddenData()['custom_icon'] ?: null,
            "stats" => Array(
                "last_activity" => ($this->getModificationDate() ? $this->getModificationDate()->getTimestamp() : null),
                "replies" => $messageEntity->getResponsesCount()
            ),
            "pinned_info" => Array(
                "pinned_by" => is_string($messageEntity->getSender()) ? $messageEntity->getSender() :  ($messageEntity->getSender() ? $messageEntity->getSender()->getId() : null),
                "pinned_at" => 0,
            ),
            "reactions" => $messageEntity->getNewApiObjectReactions($messageEntity),
        );

        return $array = array_merge($api_object, $message_type_object);
    }

    
    public function getAsArray()
    {    
        $api_object = $this->generateNewApiObject($this, $api_object);

        $old_message_object = Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "channel_id" => $this->getChannelId(),
            "parent_message_id" => $this->getParentMessageId(),
            "responses_count" => $this->getResponsesCount(),
            "message_type" => $this->getMessageType(),
            "sender" => is_string($this->getSender()) ? $this->getSender() : ($this->getSender() ? $this->getSender()->getId() : null),
            "application_id" => $this->getApplicationId(),
            "edited" => $this->getEdited(),
            "pinned" => $this->getPinned(),
            "hidden_data" => $this->getHiddenData(),
            "_reactions" => $this->getReactions(),
            "modification_date" => ($this->getModificationDate() ? $this->getModificationDate()->getTimestamp() : null),
            "creation_date" => ($this->getCreationDate() ? $this->getCreationDate()->getTimestamp() : null),
            "content" => $this->getContent(),
            "user_specific_content" => $this->getUserSpecificContent(),
            "increment_at_time" => $this->getIncrementAtTime(),
        );

        return array_merge($old_message_object, $api_object);
    }

}
