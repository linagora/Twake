<?php

namespace WebsiteApi\DriveBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;

class DriveTopic implements TopicInterface, PushableTopicInterface
{

    public function getName()
    {
        return 'drive.topic';
    }

    public function __construct()
    {
    }

    public function onPush(Topic $topic, WampRequest $request, $data, $provider)
    {
        $topic->broadcast($data);
    }

    public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
    }

    public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
    {
    }

    public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
    }

}