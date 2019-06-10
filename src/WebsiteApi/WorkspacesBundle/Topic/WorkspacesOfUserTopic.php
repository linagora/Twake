<?php
namespace WebsiteApi\WorkspacesBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use mageekguy\atoum\tests\units\asserters\error;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;

class WorkspacesOfUserTopic implements TopicInterface, PushableTopicInterface
{
    public function getName()
    {
        return 'workspaces_of_user.topic';
    }

    public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
    }

    public function onPush(Topic $topic, WampRequest $request, $event, $provider)
    {
        //error_log(print_r($event));
        $topic->broadcast($event);
    }

    public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
    {
        $topic->broadcast($event);
    }

    public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
    }

}


?>
