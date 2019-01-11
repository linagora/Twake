<?php
namespace WebsiteApi\DiscussionBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use WebsiteApi\DiscussionBundle\Services\Messages;
use WebsiteApi\UsersBundle\Entity\User;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;

class DiscussionTopic implements TopicInterface, PushableTopicInterface
{

    public function getName()
    {
        return 'discussion.topic';
    }


    //Post d'un message
    public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event = Array(), array $exclude = Array(), array $eligible = Array())
    {

        $canBroadcast = true;

        if ($operation == "NR") { //Notification read relay
            $topic->broadcast($event);
            $canBroadcast = false;
        } else {
            $canBroadcast = false;
        }

        if ($canBroadcast) {
            $topic->broadcast($event);
        } else {
            error_log("no broadcast");
        }

    }

    /* Push from server */
    public function onPush(Topic $topic, WampRequest $request, $data, $provider)
    {
        $topic->broadcast($data);
    }


    public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
    }

    public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
    }

}


?>
