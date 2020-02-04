<?php
namespace WebsiteApi\CoreBundle\Topic;

use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;

class CollectionsTopic implements TopicInterface, PushableTopicInterface
{

    public function getName()
    {
        return 'collections.topic';
    }

    public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event = Array(), array $exclude = Array(), array $eligible = Array())
    {
        $topic->broadcast($event);
    }

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
