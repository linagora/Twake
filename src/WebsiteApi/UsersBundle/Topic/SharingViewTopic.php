<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 02/07/18
 * Time: 14:28
 */

namespace WebsiteApi\UsersBundle\Topic;


use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;

class SharingViewTopic implements TopicInterface, PushableTopicInterface
{

    private $clientManipulator;

    public function __construct($clientManipulator)
    {
        $this->clientManipulator = $clientManipulator;
    }

    /**
     * @param Topic $topic
     * @param WampRequest $request
     * @param string|array $data
     * @param string $provider
     */
    public function onPush(Topic $topic, WampRequest $request, $data, $provider)
    {
    }

    /**
     * @param  ConnectionInterface $connection
     * @param  Topic $topic
     * @param WampRequest $request
     */
    public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
    }

    /**
     * @param  ConnectionInterface $connection
     * @param  Topic $topic
     * @param WampRequest $request
     */
    public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request)
    {
        $currentUser = $this->clientManipulator->getClient($connection);

        //Verify user is logged in
        if ($currentUser == null || is_string($currentUser)) {
            return; //Cancel operation
        }

        $currentUserId = $currentUser->getId();

        $topic->broadcast(array("userLeave" => $currentUserId));
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
        $topic->broadcast($event);
    }

    /**
     * @return string
     */
    public function getName()
    {
        return "sharing_view.topic";
    }
}