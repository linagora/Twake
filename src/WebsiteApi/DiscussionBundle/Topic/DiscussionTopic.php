<?php
namespace WebsiteApi\DiscussionBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use WebsiteApi\DiscussionBundle\Services\Messages;
use WebsiteApi\UsersBundle\Entity\User;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;

class DiscussionTopic implements TopicInterface, PushableTopicInterface
{

	public function getName()
	{
		return 'discussion.topic';
	}

	private $messagesService;
	private $subjectService;
	private $clientManipulator;
	private $doctrine;
	private $notif;

	public function __construct($messagesService,$subjectService, $clientManipulator, $doctrine, $notif)
	{
		$this->messagesService = $messagesService;
		$this->subjectService = $subjectService;
		$this->clientManipulator = $clientManipulator;
		$this->doctrine = $doctrine;
		$this->notif = $notif;
	}


	//Post d'un message
	public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
	{
        print_r($event);
		$operation = $event['type'];

		$key = $request->getAttributes()->get('key');
		$id = $key;
		$type = "S"; //stream

		$currentUser = $this->clientManipulator->getClient($connection);

		if (!($currentUser instanceof User)) {
			return;
		}

		if (count(explode("_", $key)) == 2) {

			$type = "U";

			//On récupère l'id de l'autre utilisateur
			$ids = explode("_", $key);
			if (count($ids) < 2) {
				return;
			}
			if ($ids[0] == $currentUser->getId()) {
				$id = intval($ids[1]);
			} else {
				$id = intval($ids[0]);
			}
		}

		//Verify user is logged in
		if ($currentUser == null
			|| is_string($currentUser)
		) {

			return; //Cancel operation

		}

		$currentUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneById($currentUser->getId());

		//Verify that this user is allowed to do this
		if ($this->messagesService->isAllowed($currentUser, $type, $id)) {

			//We can speak

			//Ask for an initialization
            $operation = $event['type'];

            if($operation == "C"){

                $message = $this->messagesService->sendMessage("U",$currentUser->getId(), $type, $id, $event['data']['content'], $event["data"]['subject']);
                $event["data"] = $message->getArray();
			}
            else if($operation == "E"){
            	$message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($event["data"]["id"]);
            	if($message != null && $message->getTypeSender()=="U" && $message->getUserSender()==$currentUser){
	                $message = $this->messagesService->editMessage($event["data"]["id"],$event["data"]["content"]);
	                $event["data"] = $message->getArray();
            	}
            }
            else if($operation == "CS"){ //creation subject
                if( isset($event["data"]["idMessage"]) && $event["data"]["idMessage"] !=null ){
                	$subject = $this->subjectService->createSubjectFromMessage($event["data"]["idMessage"]);
					$event["data"] = $subject->getArray();
				}
			}
			elseif ($operation == 'W') { // is writing
                if (isset($event['data']) && isset($event['data']['isWriting'])) {
                    $event["data"]["id"] = $currentUser->getId();
                }
            }

            $topic->broadcast($event);
		} else {
			$topic->remove($connection); //Eject the hacker !
		}

	}

	/* Push from server */
	public function onPush(Topic $topic, WampRequest $request, $data, $provider)
	{

		$topic->broadcast($data);
	}


	public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
	{
		$key = $request->getAttributes()->get('key');

		$currentUser = $this->clientManipulator->getClient($connection);

		if (!($currentUser instanceof User)) {
			return;
		}

		//Verify user is logged in
		if ($currentUser == null
			|| is_string($currentUser)
		) {

			return; //Cancel operation
		}

		$currentUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneById($currentUser->getId());

		//Verify that this user is allowed to do this
//		if (!$this->messagesService->isAllowedByKey($currentUser, $key)) {
//			$topic->remove($connection); //Eject the hacker !
//		}

	}

	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
	{
		$currentUser = $this->clientManipulator->getClient($connection);
		$route = $request->getAttributes()->get('key');
		$from = null;
		if (!($currentUser instanceof User)) {
			return;
		}

		if (count(explode("_", $route)) == 2) {

			$route = "private_message";

			//On récupère l'id de l'autre utilisateur
			$ids = explode("_", $route);
			if (count($ids) < 2) {
				return;
			}
			if ($ids[0] == $currentUser->getId()) {
				$from = intval($ids[1]);
			} else {
				$from = intval($ids[0]);
			}
		} else {
			$route = "group_message_ch" . $route;
		}

		if ($this->notif != null) {
			$this->notif->read($currentUser, $from, $route);
		}
	}

}


?>
