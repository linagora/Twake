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

    function __construct($entity_manager, $applications_api, $websockets_service)
    {
        $this->em = $entity_manager;
        $this->applications_api = $applications_api;
        $this->websockets_service = $websockets_service;
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
        foreach ($messages as $id => $message) {
            if ($current_user && count($message["reactions"]) > 0) {
                $message_reaction_repo = $this->em->getRepository("TwakeDiscussionBundle:MessageReaction");
                $message_reaction = $message_reaction_repo->findOneBy(Array("user_id" => $current_user->getId(), "message_id" => $message["id"]));
                if ($message_reaction) {
                    $messages[$id]["_user_reaction"] = $message_reaction->getReaction();
                }
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

        if ($message->getResponsesCount() > 0) {
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

        $channel_repo = $this->em->getRepository("TwakeChannelsBundle:Channel");
        $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));

        $did_create = false;

        $message = null;

        if (isset($object["id"])) {
            $message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => isset($object["_once_replace_message_parent_message"]) ? $object["_once_replace_message_parent_message"] : $object["parent_message_id"], "id" => $object["id"]));

            //Verify can modify this message
            if ($message && !$this->hasAccess($object, $current_user, $message)) {
                return false;
            }
        }

        if ($message == null) {

            //Verify can create in channel
            if (!$this->hasAccess($object, $current_user)) {
                return false;
            }


            if ($object["parent_message_id"]) {
                //Increment parent
                $new_parent = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $object["parent_message_id"]));
                if (!$new_parent) {
                    $object["parent_message_id"] = "";
                } else {
                    $new_parent->setResponsesCount($new_parent->getResponsesCount() + 1);
                    $this->em->persist($new_parent);
                    $this->share($new_parent);
                }
            }

            //Create a new message
            $message = new Message($object["channel_id"], $object["parent_message_id"]);

            $message->setModificationDate(new \DateTime());
            if ($object["front_id"]) {
                $message->setFrontId($object["front_id"]);
            }

            $channel->setMessagesCount($channel->getMessagesCount() + 1);

            $did_create = true;

            $this->em->persist($channel);

            //TODO update channel last id and last activity etc

        } else if ($message->getContent() != $object["content"]) {
            $message->setEdited(true);
            $message->setModificationDate(new \DateTime());
        }

        //Move message
        if (isset($object["_once_replace_message_parent_message"])) {
            $new_parent = null;
            if ($object["parent_message_id"]) {
                $new_parent = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $object["parent_message_id"]));
            }
            $this->moveMessageToNewParent($message, $new_parent);
        }

        if ($did_create) {
            //Set message type
            if ($application) {
                $message->setMessageType(1);
                $message->setApplicationId($application->getId());
            } else if (!$user && !$application) {
                $message->setMessageType(2);
            } else if ($user && !$application) {
                $message->setMessageType(0);
            }
        }

        //If no sender set, update sender (can be modified after)
        if (!$message->getSender() && $message->getMessageType() == 0) {
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

                if ($user_reaction == $message_reaction->getReaction()) {
                    //Noop
                } else if (!$user_reaction) {
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


        if ($channel->getAppId()) {
            if ($did_create) {
                $this->applications_api->notifyApp($channel->getAppId(), "private_message", "new_message", Array("message" => $message->getAsArray()));
            } else {
                $this->applications_api->notifyApp($channel->getAppId(), "private_message", "edit_message", Array("message" => $message->getAsArray()));
            }
        }

        return $message->getAsArray();

    }

    private function moveMessageToNewParent(Message $messageA, $messageB, $flush = true)
    {

        if (!$messageA->getParentMessageId() && !$messageB || $messageB && $messageA->getParentMessageId() == $messageB->getId()) {
            return;
        }

        $this->em->remove($messageA);
        $this->em->flush();

        $new_parent_message_id = $messageB ? $messageB->getId() : "";

        $messageA->setParentMessageId($new_parent_message_id);

        if ($messageA->getResponsesCount() > 0) {
            $message_repo = $this->em->getRepository("TwakeDiscussionBundle:Message");

            //Move all children to the same parent message id
            $others = $message_repo->findBy(Array("channel_id" => $messageA->getChannelId(), "parent_message_id" => $messageA->getId()));

            foreach ($others as $message) {
                $this->moveMessageToNewParent($message, $messageB, false);
            }

        }

        if ($messageB) {
            $messageB->setResponsesCount($messageB->getResponsesCount() + 1);
        }

        $messageA->setResponsesCount(0);
        $this->em->persist($messageA);

        $this->share($messageA);

        if ($flush) {
            $this->share($messageB);
            $this->em->flush();
        }

        return $messageA;

    }

    private function share($message)
    {

        $event = Array(
            "client_id" => "system",
            "action" => "save",
            "object_type" => "",
            "object" => $message->getAsArray()
        );
        $this->websockets_service->push("messages/" . $message->getChannelId(), $event);

    }

}
