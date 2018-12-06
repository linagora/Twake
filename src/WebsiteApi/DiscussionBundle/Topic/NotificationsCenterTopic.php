<?php
namespace WebsiteApi\DiscussionBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use WebsiteApi\DiscussionBundle\Services\Messages;
use WebsiteApi\UsersBundle\Entity\User;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;

class NotificationsCenterTopic implements TopicInterface, PushableTopicInterface
{

	public function getName()
	{
		return 'discussion.notifications.topic';
	}

    public function __construct()
    {
    }


	public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
	{

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
