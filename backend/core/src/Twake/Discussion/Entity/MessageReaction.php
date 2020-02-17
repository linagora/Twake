<?php

namespace Twake\Discussion\Entity;

use Doctrine\ORM\Mapping as ORM;


use Twake\Core\Entity\FrontObject;

/**
 * Message
 *
 * @ORM\Table(name="message_reaction",options={"engine":"MyISAM", "scylladb_keys": {{"message_id":"ASC", "user_id":"ASC"}} })
 * @ORM\Entity()
 */
class MessageReaction
{

    /**
     * @ORM\Column(name="message_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $message_id;

    /**
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $user_id;

    /**
     * @ORM\Column(name="reaction", type="twake_text")
     */
    private $reaction = "";

    /**
     * Message constructor.
     */
    public function __construct($message_id, $user_id)
    {
        $this->message_id = $message_id;
        $this->user_id = $user_id;
    }

    /**
     * @return mixed
     */
    public function getReaction()
    {
        return $this->reaction;
    }

    /**
     * @param mixed $reaction
     */
    public function setReaction($reaction)
    {
        $this->reaction = $reaction;
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->user_id;
    }


}
