<?php
namespace WebsiteApi\DiscussionBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use WebsiteApi\UsersBundle\Entity\User;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;

class DiscussionSpaceTopic implements TopicInterface, PushableTopicInterface
{

    public function getName()
    {
        return 'discussionspace.topic';
    }

    private $streamService;
    private $clientManipulator;
    private $doctrine;
    private $notif;

    public function __construct($streamService, $clientManipulator, $doctrine)
    {
        $this->streamService = $streamService;
        $this->clientManipulator = $clientManipulator;
        $this->doctrine = $doctrine;
    }

    /**
     * @param Topic $topic
     * @param WampRequest $request
     * @param string|array $data
     * @param string $provider
     */
    public function onPush(Topic $topic, WampRequest $request, $data, $provider)
    {
        // TODO: Implement onPush() method.
    }

    /**
     * @param  ConnectionInterface $connection
     * @param  Topic $topic
     * @param WampRequest $request
     */
    public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
        // TODO: Implement onSubscribe() method.
    }

    /**
     * @param  ConnectionInterface $connection
     * @param  Topic $topic
     * @param WampRequest $request
     */
    public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
        // TODO: Implement onUnSubscribe() method.
    }

    /**
     * @param  ConnectionInterface $connection
     * @param  Topic $topic
     * @param WampRequest $request
     * @param $event
     * @param  array $exclude
     * @param  array $eligible
     */
    public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
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

        $canBroadcast = true;

        if($event["type"] == "C"){ // creation
            if($this->streamService->isAllowed($currentUser->getId(),$key)){
                $stream = $this->streamService->createStream($currentUser,$key,$event["data"]["name"],$event["data"]["isPrivate"],$event["data"]["description"]);
                if($stream){
                    $event["data"] = $stream;
                }
                else{
                    $canBroadcast = false;
                }
            }
        }
        elseif($event["type"] == "E"){ // edition
            error_log("edition");
            if($this->streamService->isAllowed($currentUser->getId(),$key)){
                if(isset($event["data"]["id"]) && isset($event["data"]["name"]) && isset($event["data"]["isPrivate"]) && isset($event["data"]["members"]) )
                $stream = $this->streamService->editStream($event["data"]["id"],$event["data"]["name"],$event["data"]["isPrivate"],$event["data"]["members"],$event["data"]["description"],$currentUser);
                if($stream){
                    $event["data"] = $stream;
                }
                else{
                    $canBroadcast = false;
                }
            }
        }
        if($canBroadcast){
            $topic->broadcast($event);
        }
    }
}