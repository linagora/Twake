<?php
namespace WebsiteApi\UsersBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use WebsiteApi\NotificationsBundle\Services\Notifications;
use Gos\Bundle\WebSocketBundle\Client\ClientManipulatorInterface;

class NotificationsTopic implements TopicInterface, PushableTopicInterface
{
	public function getName(){ return 'notifications.topic'; }

	var $doctrine;

    public function __construct($doctrine) {
	    $this->doctrine = $doctrine;
    }

    public function onSubscribe( ConnectionInterface $connection, Topic $topic, WampRequest $request ){}

	public function onPush(Topic $topic, WampRequest $request, $connected, $provider)
	{
		//TODO
	}



	/* UNUSED */

	public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible){
	}
	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){
	}

}


?>
