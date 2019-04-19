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

    function __construct($entity_manager, $applications_api, $websockets_service, $message_notifications_center_service)
    {
        $this->em = $entity_manager;
        $this->applications_api = $applications_api;
        $this->websockets_service = $websockets_service;
        $this->message_notifications_center_service = $message_notifications_center_service;
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

            //If possible, show only current user content !
            if ($current_user && isset($message["user_specific_content"][$current_user->getId()])) {
                $tmp = Array();
                $tmp[$current_user->getId()] = $message["user_specific_content"][$current_user->getId()];
                $message["user_specific_content"] = $tmp;
            }

            if ($current_user && count($message["reactions"]) > 0) {
                $message_reaction_repo = $this->em->getRepository("TwakeDiscussionBundle:MessageReaction");
                $message_reaction = $message_reaction_repo->findOneBy(Array("user_id" => $current_user->getId(), "message_id" => $message["id"]));
                if ($message_reaction) {
                    $messages[$id]["_user_reaction"] = $message_reaction->getReaction();
                }
            }

        }

        $channel = $this->em->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel_id));
        $this->message_notifications_center_service->read($channel, $current_user);

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

        //TODO for allow_delete == "administrators" implement user access verification
        if (!($this->hasAccess($object, $current_user, $message) || $object["hidden_data"]["allow_delete"] == "everyone" || $object["hidden_data"]["allow_delete"] == "administrators")) {
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

    /**
     * @param $object
     * @param $options
     * @param null $user
     * @param null $application
     * @return array
     */
    public function save($object, $options, $user = null, $application = null)
    {

        $channel_id = $object["channel_id"];
        if (!$channel_id) {
            return false;
        }

        if (!$object["parent_message_id"]) {
            $object["parent_message_id"] = "";
        }

        $ephemeral = (isset($object["_once_ephemeral_message"]) && $object["_once_ephemeral_message"] || isset($object["ephemeral_id"]) && $object["ephemeral_id"]);

        $message_repo = $this->em->getRepository("TwakeDiscussionBundle:Message");

        $channel_repo = $this->em->getRepository("TwakeChannelsBundle:Channel");
        $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));

        $did_create = false;

        $message = null;

        if (isset($object["id"])) {
            $message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => isset($object["_once_replace_message_parent_message"]) ? $object["_once_replace_message_parent_message"] : $object["parent_message_id"], "id" => $object["id"]));

            if (!$message) {
                $message = $message_repo->findOneBy(Array("id" => $object["id"]));
                if ($message) {
                    if (isset($object["channel_id"]) && $object["channel_id"] != $message->getChannelId()) {
                        return false;
                    }
                    if (isset($object["_once_replace_message_parent_message"]) && $object["_once_replace_message_parent_message"] != $message->getParentMessageId()) {
                        return false;
                    } else if (isset($object["parent_message_id"]) && $object["parent_message_id"] != $message->getParentMessageId()) {
                        return false;
                    }
                } else {
                    return falses;
                }
            }

            //Verify can modify this message
            if ($message && !$this->hasAccess($object, $current_user, $message)) {
                return false;
            }

            if (!$message) {
                return false;
            }

            foreach ($message->getAsArray() as $key => $value) {
                if (!isset($object[$key])) {
                    $object[$key] = $value;
                }
            }

        }

        if ($message == null) {

            //Verify can create in channel
            if (!$this->hasAccess($object, $current_user)) {
                return false;
            }


            if (!$ephemeral && $object["parent_message_id"]) {
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

            if ($object["ephemeral_id"]) {
                $message->setId($object["ephemeral_id"]);
                $message->setFrontId($object["ephemeral_id"]);
            }

            $did_create = true;

        } else if ($message->getContent() != $object["content"]) {
            $message->setEdited(true);
            $message->setModificationDate(new \DateTime());
        }

        //Move message
        if (!$ephemeral && isset($object["_once_replace_message_parent_message"])) {
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
                if ($user) {
                    $message->setSender($user);
                }
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
        if ($application && isset($object["_once_user_specific_update"])) {

            $specific_data = $message->getUserSpecificContent();
            if (!$specific_data) {
                $specific_data = Array();
            }
            $updates = $object["_once_user_specific_update"];
            if ($updates["user_id"]) {
                $updates = Array($updates);
            }
            foreach ($updates as $update) {
                $user_id = $update["user_id"];
                $modifiers = $update["modifiers"];
                $replace_all_keys = $update["replace_all"];
                if ($replace_all_keys) {
                    $specific_data[$user_id] = $modifiers;
                } else {
                    foreach ($modifiers as $key => $data) {
                        $specific_data[$user_id][$key] = $data;
                    }
                }
            }
            $message->setUserSpecificContent($specific_data);
        }

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

        if (!$ephemeral) {

            if ($channel && $did_create) {
                $channel->setMessagesCount($channel->getMessagesCount() + 1);
                $this->em->persist($channel);
            }

            $this->em->flush();

            if ($channel && $did_create) {
                $this->message_notifications_center_service->newElement($channel, $application, $user, $this->mdToText($message->getContent()), $message->getId());
            }

            if ($channel->getAppId()) {
                if ($did_create) {
                    $this->applications_api->notifyApp($channel->getAppId(), "private_message", "new_message", Array("message" => $message->getAsArray()));
                } else {
                    $this->applications_api->notifyApp($channel->getAppId(), "private_message", "edit_message", Array("message" => $message->getAsArray()));
                }
            }

        }

        $array = $message->getAsArray();

        if ($ephemeral) {
            $array["ephemeral_id"] = $message->getId();
            $array["_user_ephemeral"] = true;
            if (isset($object["ephemeral_message_recipients"])) {
                $array["ephemeral_message_recipients"] = $object["ephemeral_message_recipients"];
            }
        }

        return $array;

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

        if (!$message) {
            return;
        }

        $event = Array(
            "client_id" => "system",
            "action" => "save",
            "object_type" => "",
            "object" => $message->getAsArray()
        );
        $this->websockets_service->push("messages/" . $message->getChannelId(), $event);

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
