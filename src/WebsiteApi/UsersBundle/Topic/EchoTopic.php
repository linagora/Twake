<?php
namespace WebsiteApi\UsersBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use WebsiteApi\NotificationsBundle\Services\Notifications;
use Gos\Bundle\WebSocketBundle\Client\ClientManipulatorInterface;
use WebsiteApi\UsersBundle\Entity\User;

class EchoTopic implements TopicInterface, PushableTopicInterface
{
	public function getName(){ return 'echo.topic'; }

	public function __construct($clientManipulator) {
		$this->clientManipulator = $clientManipulator;
	}

    public function onSubscribe( ConnectionInterface $connection, Topic $topic, WampRequest $request ){}
	public function onPush(Topic $topic, WampRequest $request, $connected, $provider)
	{}

	public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event=null, array $exclude = Array(), array $eligible = Array()){
		$currentUser = $this->clientManipulator->getClient($connection);
		if (!($currentUser instanceof User)) {
			$topic->broadcast(Array("id"=>-1, "token"=>$event["token"]));
			return;
		}
		//Verify user is logged in
		if ($currentUser == null
			|| is_string($currentUser)
		) {
			$topic->broadcast(Array("id"=>-1, "token"=>$event["token"]));
			return; //Cancel operation
		}
		$topic->broadcast(Array("id"=>$currentUser->getId(), "token"=>$event["token"]));
	}
	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){
	}

}


?>
