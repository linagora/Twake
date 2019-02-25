<?php


namespace WebsiteApi\DiscussionBundle\Services;

use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\DiscussionBundle\Entity\Call;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DiscussionBundle\Entity\MessageLike;
use WebsiteApi\DiscussionBundle\Entity\Channel;
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
            $messages[] = $message->getAsArray();

            if ($parent_message_id != "" && $message->getResponsesCount() > 0) {
                $messages_responses_ent = $message_repo->findBy(Array("channel_id" => $channel_id, "parent_message_id" => $message->getId()), Array(), 10, null, "id", "DESC");
                foreach ($messages_responses_ent as $message_response) {
                    $messages[] = $message_response->getAsArray();
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

        if ($message->getParentMessageId()) {
            $parent_message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $message->getParentMessageId()));
            $parent_message->setResponsesCount($parent_message->getResponsesCount() - 1);
            $this->em->persist($parent_message);
        }

        $channel_repo = $this->em->getRepository("TwakeChannelsBundle:Channel");
        $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));
        $channel->setMessagesCount($channel->getMessagesCount() - 1);

        $this->em->persist($channel);

        $this->em->remove($message);
        $this->em->flush();

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

        $message = null;
        if (isset($object["id"])) {
            $message_repo = $this->em->getRepository("TwakeDiscussionBundle:Message");
            $message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => $object["parent_message_id"], "id" => $object["id"]));

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

            $message = new Message($object["channel_id"], $object["parent_message_id"]);
            $message->setFrontId($object["front_id"]);

            if ($object["parent_message_id"]) {
                $parent_message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $object["parent_message_id"]));
                $parent_message->setResponsesCount($parent_message->getResponsesCount() + 1);
                $this->em->persist($parent_message);
            }

            $channel_repo = $this->em->getRepository("TwakeChannelsBundle:Channel");
            $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));
            $channel->setMessagesCount($channel->getMessagesCount() + 1);

            $this->em->persist($channel);
            //TODO update channel last id and last activity etc

        } else {
            $message->setEdited(true);
        }


        if ($application) {
            $message->setMessageType(1);
            $message->setApplication($application);
        } else if (!$current_user && !$application) {
            $message->setMessageType(2);
        } else if ($current_user && !$application) {
            $message->setMessageType(0);
        }
        $message->setSender($user);
        $message->setHiddenData($object["hidden_data"]);

        $message->setContent($object["content"]);
        $message->setPinned($object["pinned"]);
        $message->setModificationDate(new \DateTime());

        $this->em->persist($message);
        $this->em->flush();

        return $message->getAsArray();

    }

}
