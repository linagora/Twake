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
        $canBroadcast = true;
		$key = $request->getAttributes()->get('key');
		$currentUser = $this->clientManipulator->getClient($connection);

		//Verify user is logged in
		if ($currentUser == null || is_string($currentUser)){
			return; //Cancel operation
		}

		$currentUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneById($currentUser->getId());

		//Verify that this user is allowed to do this
		$stream = $this->messagesService->getStream($key, $currentUser->getId());
		if ($stream && $this->messagesService->isAllowed($stream, $currentUser)) {

			//We can speak

			//Ask for an initialization
            $operation = $event['type'];

            if($operation == "C"){

	            if(isset($event["data"]['fileId']) && $event["data"]['fileId']!=null){
                    $message = $this->messagesService->sendMessageWithFile($currentUser->getId(), $key,$event['data']['content'],$event["data"]['workspace'], $event["data"]['subject'],$event["data"]['fileId']);
				}
				else{
                    $message = $this->messagesService->sendMessage($currentUser->getId(), $key, false, null, false,  $event['data']['content'],$event["data"]['workspace'], $event["data"]['subject']);
				}
				if($message){

					$event["data"] = $message->getAsArray();
				}
				else{
					$canBroadcast = false;
				}
			}
            else if($operation == "E"){
            	$message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($event["data"]["id"]);
            	if($message != null && $message->getUserSender()==$currentUser){
	                $messageArray = $this->messagesService->editMessage($event["data"]["id"],$event["data"]["content"],$currentUser);
	                if($messageArray){
                        $event["data"] = $messageArray;
					}
					else{
	                	$canBroadcast = false;
					}
            	}
            }
            else if($operation == "CS"){ //creation subject
                if( isset($event["data"]["idMessage"]) && $event["data"]["idMessage"] !=null ){
                	$subjectArray = $this->subjectService->createSubjectFromMessage($event["data"]["idMessage"],$currentUser);
                	if($subjectArray){
                        $event["data"] = $subjectArray;
					}
					else{
                		$canBroadcast = false;
					}
				}
			}else if($operation == "ES"){ //edition subject
                if( isset($event["data"]["idSubject"]) && $event["data"]["idSubject"] !=null ){
                	$subjectArray = $this->subjectService->editSubject($event["data"]["idSubject"],$event["data"]["name"],$event["data"]["description"],$event["data"]["isOpen"],$currentUser);
                	if($subjectArray){
                        $event["data"] = $subjectArray;
					}
					else{
                		$canBroadcast = false;
					}
				}
                else{
                    $canBroadcast = false;
                }
            }
			elseif ($operation == 'W') { // is writing
                if (isset($event['data']) && isset($event['data']['isWriting'])) {
                    $event["data"]["id"] = $currentUser->getId();
                }
            }
            elseif ($operation == 'P'){ // pinned message
            	if(isset($event["data"]) && isset($event["data"]["id"]) && isset($event["data"]["pinned"])){
            		$messageArray = $this->messagesService->pinMessage($event["data"]["id"],$event["data"]["pinned"],$currentUser);
            		if($messageArray){
                        $event["data"] = $messageArray;
					}
					else{
            			$canBroadcast = false;
					}
				}
			}
            elseif ($operation == 'MM') { // move message in other
                if (isset($event['data']) && isset($event['data']['idDrop']) && isset($event['data']['idDragged'])  && $event['data']['idDragged']!=$event['data']['idDrop']) {
                    $messageDropInfos = $this->messagesService->moveMessageInMessage($event["data"]["idDrop"],$event["data"]["idDragged"],$currentUser);
                    if($messageDropInfos){
                        $event["data"] = $messageDropInfos;
                    }
                    else{
                        $canBroadcast = false;
                    }
                }
                else{
                    $canBroadcast = false;
                }
            } elseif ($operation == 'MS') { // move message in subject
                if (isset($event['data']) &&  isset($event['data']['idDragged']) && isset($event['data']['idSubject']) ) {
                    $messageInfos = $this->messagesService->moveMessageInSubject($event["data"]["idSubject"],$event["data"]["idDragged"],$currentUser);
                    if($messageInfos){
                        $event["data"] = $messageInfos;
                    }
                    else{
                        $canBroadcast = false;
                    }
                }
                else{
                    $canBroadcast = false;
                }
            }
			elseif ($operation == 'MMnot') { // remove message from message
                if (isset($event['data']) && isset($event['data']['idDragged'])) {
                    $messageInfos= $this->messagesService->moveMessageOutMessage($event["data"]["idDragged"],$currentUser);
                    if($messageInfos){
                        $event["data"]= $messageInfos;
                    }
                    else{
                        $canBroadcast = false;
                    }
                }
                else{
                    $canBroadcast = false;
                }
            }
            elseif ($operation == 'D') { // delete message
                if (isset($event['data']) && isset($event['data']['id'])) {
                    $messageInfos = $this->messagesService->deleteMessage($event["data"]["id"],$currentUser);
                    if($messageInfos){
                        $event["data"]= $messageInfos;
                    }
                    else{
                        $canBroadcast = false;
                    }
                }
                else{
                    $canBroadcast = false;
                }
            }
            else{
            	$canBroadcast = false;
			}

			if($canBroadcast){
            	$topic->broadcast($event);
			}
			else{
                error_log("no broadcast");
            }
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

	}

	public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
	{
		$currentUser = $this->clientManipulator->getClient($connection);
		$from = null;
		if (!($currentUser instanceof User)) {
			return;
		}
	}

}


?>
