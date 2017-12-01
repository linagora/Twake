<?php
namespace WebsiteApi\UsersBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use WebsiteApi\UsersBundle\Services\Notifications;
use Gos\Bundle\WebSocketBundle\Client\ClientManipulatorInterface;
class EchoTopic implements TopicInterface, PushableTopicInterface
{
	public function getName(){ return 'echo.topic'; }


    public function __construct() {
    }

	public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible){
		if($event=="echo"){
			$topic->broadcast("echo");
		}
	}

	/* UNUSED */

    public function onSubscribe( ConnectionInterface $connection, Topic $topic, WampRequest $request ){
    }

	public function onPush(Topic $topic, WampRequest $request, $data, $provider)
	{
	}

	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){
	}

}


?>
