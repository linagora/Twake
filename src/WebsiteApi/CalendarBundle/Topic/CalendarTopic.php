<?php
namespace WebsiteApi\CalendarBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use WebsiteApi\UsersBundle\Entity\User;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;

class CalendarTopic implements TopicInterface, PushableTopicInterface
{

    public function getName()
    {
        return 'calendar.topic';
    }

    private $clientManipulator;
    private $doctrine;
    private $notif;

    public function __construct($clientManipulator, $doctrine, $notif)
    {
        $this->clientManipulator = $clientManipulator;
        $this->doctrine = $doctrine;
        $this->notif = $notif;
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

//        //Verify that this user is allowed to do this
//        if (!$this->messagesService->isAllowedByKey($currentUser, $key)) {
//            $topic->remove($connection); //Eject the hacker !
//        }
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
        // TODO: Implement onPublish() method.
    }
}