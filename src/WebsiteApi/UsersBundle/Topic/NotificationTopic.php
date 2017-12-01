<?php
namespace WebsiteApi\UsersBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use WebsiteApi\UsersBundle\Services\Notifications;
use Gos\Bundle\WebSocketBundle\Client\ClientManipulatorInterface;
class NotificationTopic implements TopicInterface, PushableTopicInterface
{
	public function getName(){ return 'infosNotification.topic'; }

	var $doctrine;
    var $tokenStorage;
    var $clientManipulator;

    public function __construct( $doctrine,Notifications $notificationManager,ClientManipulatorInterface $clientManipulator) {
        $this->doctrine = $doctrine;
        $this->notificationManager = $notificationManager;
        $this->clientManipulator = $clientManipulator;
    }

    public function onSubscribe( ConnectionInterface $connection, Topic $topic, WampRequest $request ){
	    $user = $this->clientManipulator->getClient($connection);
        if($user && is_string($user)){
            $topic->broadcast(['msg'=>'notConnected']);
        }
        else {
            $notifs = $this->notificationManager->get($user);
            $topic->broadcast(Array(
	                "type"=>"init",
		            "data"=>$notifs
	            )
            );
        }
    }
	public function onPush(Topic $topic, WampRequest $request, $data, $provider)
	{
		$topic->broadcast($data);
	}

	public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible){
		if($event=="echo"){
			$topic->broadcast("echo");
		}
	}

	/* UNUSED */
	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){
	}

}


?>
