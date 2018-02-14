<?php
namespace WebsiteApi\NotificationsBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use WebsiteApi\NotificationsBundle\Services\Notifications;
use Gos\Bundle\WebSocketBundle\Client\ClientManipulatorInterface;
use WebsiteApi\UsersBundle\Entity\User;

class NotificationsTopic implements TopicInterface, PushableTopicInterface
{
	public function getName(){ return 'notifications.topic'; }

	var $doctrine;
	var $clientManipulator;

    public function __construct($clientManipulator, $doctrine) {
	    $this->doctrine = $doctrine;
	    $this->clientManipulator = $clientManipulator;
    }

    public function onSubscribe( ConnectionInterface $connection, Topic $topic, WampRequest $request ){
	    $currentUser = $this->clientManipulator->getClient($connection);
	    if (!($currentUser instanceof User)) {
		    $topic->remove($connection); //Eject the hacker !
		    return;
	    }
	    //Verify user is logged in
	    if ($currentUser == null
		    || is_string($currentUser)
	    ) {
		    $topic->remove($connection); //Eject the hacker !
		    return; //Cancel operation
	    }
	    if($currentUser->getId()!= $request->getAttributes()->get('id_user')){
		    $topic->remove($connection); //Eject the hacker !
		    return;
	    }
    }

	public function onPush(Topic $topic, WampRequest $request, $data, $provider)
	{
		$topic->broadcast($data);
	}


	/* UNUSED */

	public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible){
	}
	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){
	}

}


?>
