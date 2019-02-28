<?php


namespace WebsiteApi\DiscussionBundle\Services;

use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\DiscussionBundle\Entity\Call;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DiscussionBundle\Entity\MessageLike;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\DiscussionBundle\Entity\MessageReaction;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\UsersBundle\Entity\User;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\DiscussionBundle\Model\MessagesSystemInterface;

class MessageSystem
{

    function __construct($entity_manager)
    {
        $this->em = $entity_manager;
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in CoreBundle/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        //TODO
        return true;
    }

    public function hasAccess($data, $current_user = null, $message = null)
    {
        //Verify message access
        if ($message) {
            if ($current_user && $message->getSender() && $message->getSender()->getId() != $current_user->getId()) {
                return false; //Not my message
            }
        }

        //TODO verify channel access
        $channel_id = $data["channel_id"];
        //TODO

        return true;
    }

    public function get($options, $current_user)
    {
        $channel_id = $options["channel_id"];
        if (!$channel_id) {
            return false;
        }

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $message_repo = $this->em->getRepository("TwakeDiscussionBundle:Message");

        $offset = isset($options["offset"]) ? $options["offset"] : null;
        $limit = isset($options["limit"]) ? $options["limit"] : 100;
        $parent_message_id = isset($options["parent_message_id"]) ? $options["parent_message_id"] : "";

        $messages_ent = $message_repo->findBy(Array("channel_id" => $channel_id, "parent_message_id" => $parent_message_id), Array(), $limit, $offset, "id", "DESC");

        $messages_ent = array_reverse($messages_ent);

        $messages = [];
        foreach ($messages_ent as $message) {
            if ($parent_message_id == "" && $message->getResponsesCount() > 0) {
                $messages_responses_ent = $message_repo->findBy(Array("channel_id" => $channel_id, "parent_message_id" => $message->getId()), Array(), 10, null, "id", "DESC");
                if (count($messages_responses_ent) == 0) {
                    $message->setResponsesCount(0);
                    $this->em->persist($message);
                    $this->em->flush();
                }
                foreach ($messages_responses_ent as $message_response) {
                    $messages[] = $message_response->getAsArray();
                }
            }

            $messages[] = $message->getAsArray();
        }

        //Add my reaction if necessary
        foreach ($messages as $message) {
            if ($current_user && count($message["reactions"]) > 0) {
                $message_reaction_repo = $this->em->getRepository("TwakeDiscussionBundle:MessageReaction");
                $message_reaction = $message_reaction_repo->findOneBy(Array("user_id" => $current_user->getId(), "message_id" => $message["id"]));
                $message["_user_reaction"] = $message_reaction->getReaction();
            }
        }


        return $messages;
    }

    public function remove($object, $options, $current_user)
    {
        $channel_id = $object["channel_id"];
        if (!$channel_id) {
            return false;
        }

        if (!$object["parent_message_id"]) {
            $object["parent_message_id"] = "";
        }

        $message_repo = $this->em->getRepository("TwakeDiscussionBundle:Message");
        $message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => $object["parent_message_id"], "id" => $object["id"]));

        if (!$this->hasAccess($object, $current_user, $message)) {
            return false;
        }

        if ($message->getParentMessageId()) {
            $parent_message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $message->getParentMessageId()));
            $parent_message->setResponsesCount($parent_message->getResponsesCount() - 1);
            $this->em->persist($parent_message);
        }

        $channel_repo = $this->em->getRepository("TwakeChannelsBundle:Channel");
        $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));
        $channel->setMessagesCount($channel->getMessagesCount() - 1);

        $this->em->persist($channel);

        $array_before_delete = $message->getAsArray();

        $this->em->remove($message);
        $this->em->flush();

        return $array_before_delete;

    }

    public function save($object, $options, $user = null, $application = null)
    {
        $channel_id = $object["channel_id"];
        if (!$channel_id) {
            return false;
        }

        if (!$object["parent_message_id"]) {
            $object["parent_message_id"] = "";
        }

        $message_repo = $this->em->getRepository("TwakeDiscussionBundle:Message");


        $message = null;

        /* A note about creation of new messages entity
           - when messages are moved from a parent to another, we remove the old message and create a new one with the same old id
           - This case is covered when "replace_message" is defined (a new message will be created to replace "replace_message")
        */

        //This case is when we want to modify existing message (no deplacement)
        if (isset($object["id"]) && !isset($object["replace_message"])) {
            $message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => $object["parent_message_id"], "id" => $object["id"]));

            //Verify can modify this message
            if ($message && !$this->hasAccess($object, $current_user, $message)) {
                return false;
            }
        }

        //This case is when we want to modify existing message WITH DEPLACEMENT or just create a new message
        if ($message == null || (isset($object["replace_message"]) && $object["replace_message"])) {

            //Verify can create in channel
            if (!$this->hasAccess($object, $current_user)) {
                return false;
            }

            //Create a new message
            $message = new Message($object["channel_id"], $object["parent_message_id"]);
            $message->setModificationDate(new \DateTime());

            //If we are in replacement, copy old message keys and remove old one :
            $old_parent_message_id = null;
            if (isset($object["replace_message"])) {
                $replacement = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => $object["replace_message_parent_message"], "id" => $object["replace_message"]));
                if ($replacement && $this->hasAccess($replacement->getAsArray(), $current_user)) {
                    $old_parent_message_id = $replacement->getParentMessageId();
                    $this->em->remove($replacement);
                    $this->em->flush();
                }
                $cd = new \DateTime();
                $cd->setTimestamp($object["creation_date"]);
                $message->setCreationDate($cd);
                $cd = new \DateTime();
                $cd->setTimestamp($object["modification_date"]);
                $message->setModificationDate($cd);
                $message->setEdited($object["edited"]);
                $message->setSender($replacement->getSender());
                $message->setId($object["replace_message"]);
            }
            $message->setFrontId($object["front_id"]);

            if ($old_parent_message_id) {
                $old_parent_message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $old_parent_message_id));
                $old_parent_message->setResponsesCount($old_parent_message->getResponsesCount() - 1);
                $this->em->persist($old_parent_message);
            }

            if ($object["parent_message_id"]) {
                $parent_message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $object["parent_message_id"]));
                $parent_message->setResponsesCount($parent_message->getResponsesCount() + 1);
                $this->em->persist($parent_message);
            }
            // End of message replacement //

            $channel_repo = $this->em->getRepository("TwakeChannelsBundle:Channel");
            $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));
            $channel->setMessagesCount($channel->getMessagesCount() + 1);

            $this->em->persist($channel);
            //TODO update channel last id and last activity etc

        } else if ($message->getContent() != $object["content"]) {
            $message->setEdited(true);
            $message->setModificationDate(new \DateTime());
        }

        //Set message type
        if ($application) {
            $message->setMessageType(1);
            $message->setApplication($application);
        } else if (!$user && !$application) {
            $message->setMessageType(2);
        } else if ($user && !$application) {
            $message->setMessageType(0);
        }

        //If no sender set, update sender (can be modified after)
        if (!$message->getSender()) {
            $message->setSender($user);
        }

        //Update message values

        $message->setHiddenData($object["hidden_data"]);
        $message->setContent($object["content"]);
        $message->setPinned($object["pinned"]);


        //Update reactions
        if (isset($object["_user_reaction"]) && $user && $message->getId()) {

            $message_reaction_repo = $this->em->getRepository("TwakeDiscussionBundle:MessageReaction");
            $message_reaction = $message_reaction_repo->findOneBy(Array("user_id" => $user->getId(), "message_id" => $message->getId()));

            $current_reactions = $message->getReactions();
            $user_reaction = $object["_user_reaction"];
            $reaction = Array();

            if ($message_reaction) {

                if ($user_reaction == $message_reaction->getReaction() || !$user_reaction) {
                    $this->em->remove($message_reaction);
                    $reaction["remove"] = $message_reaction->getReaction();
                } else {
                    $reaction["remove"] = $message_reaction->getReaction();
                    $reaction["add"] = $user_reaction;
                    $message_reaction->setReaction($user_reaction);
                    $this->em->persist($message_reaction);
                }

            } else if ($user_reaction) {
                $message_reaction = new MessageReaction($message->getId(), $user->getId());
                $reaction["add"] = $user_reaction;
                $message_reaction->setReaction($user_reaction);
                $this->em->persist($message_reaction);
            }

            if (isset($reaction["add"])) {
                if (!isset($current_reactions[$reaction["add"]])) {
                    $current_reactions[$reaction["add"]] = 0;
                }
                $current_reactions[$reaction["add"]] += 1;
            }
            if (isset($reaction["remove"])) {
                if (!isset($current_reactions[$reaction["remove"]])) {
                    $current_reactions[$reaction["remove"]] = 0;
                } else {
                    $current_reactions[$reaction["remove"]] += -1;
                }
                if ($current_reactions[$reaction["remove"]] <= 0) {
                    unset($current_reactions[$reaction["remove"]]);
                }
            }
            $message->setReactions($current_reactions);

        }


        $this->em->persist($message);
        $this->em->flush();

        return $message->getAsArray();

    }

}
