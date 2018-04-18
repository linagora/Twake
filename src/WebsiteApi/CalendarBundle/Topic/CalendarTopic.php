<?php
namespace WebsiteApi\CalendarBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Symfony\Component\Validator\Constraints\DateTime;
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
    private $notifications;
    private $eventSystem;

    public function __construct($clientManipulator, $doctrine, $notifications, $event)
    {
        $this->clientManipulator = $clientManipulator;
        $this->doctrine = $doctrine;
        $this->notifications = $notifications;
        $this->eventSystem = $event;
    }

    public function onPush(Topic $topic, WampRequest $request, $data, $provider){
        $topic->broadcast($data);
    }

    public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){}

    public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible){}

    public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request){}

}