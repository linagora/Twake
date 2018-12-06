<?php
namespace WebsiteApi\UsersBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use WebsiteApi\NotificationsBundle\Services\Notifications;
use Gos\Bundle\WebSocketBundle\Client\ClientManipulatorInterface;

class ConnectionsTopic implements TopicInterface, PushableTopicInterface
{
	public function getName(){ return 'connections.topic'; }

    public function onSubscribe( ConnectionInterface $connection, Topic $topic, WampRequest $request ){}

    public function onPush(Topic $topic, WampRequest $request, $connected, $provider)
    {
    }

    public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
    {
        $topic->broadcast($event);
	}

	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){
	}

}


?>
