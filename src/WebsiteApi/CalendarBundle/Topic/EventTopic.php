<?php
namespace WebsiteApi\CalendarBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\UsersBundle\Entity\User;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;

class EventTopic implements TopicInterface, PushableTopicInterface
{

    public function getName()
    {
        return 'event.topic';
    }

    private $clientManipulator;
    private $doctrine;
    private $notif;
    private $eventSystem;

    public function __construct($clientManipulator, $doctrine, $notif, $event)
    {
        $this->clientManipulator = $clientManipulator;
        $this->doctrine = $doctrine;
        $this->notif = $notif;
        $this->eventSystem = $event;
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
        error_log("message ".$event["type"]);
        print_r($event);

        $calendarId = $request->getAttributes()->get('key');
        $currentUser = $this->clientManipulator->getClient($connection);

        if($event["type"] == "createEvent"){
            $eventRetour = $this->eventSystem->createEvent($currentUser, $event["data"]["title"], $event["data"]["startDate"], $event["data"]["endDate"], $event["data"]["description"], $event["data"]["location"], $event["data"]["color"], $calendarId,null);
            $event["data"] = $eventRetour->getArray();
        }
        elseif($event["type"] == "updateEvent"){
            if(!isset($event["data"]["owner"])){
                $event["data"]["owner"] = null;
            }
            if(!isset($event["data"]["appid"])){
                $event["data"]["appid"] = null;
            }
            $eventRetour = $this->eventSystem->updateEvent($event["data"]["id"],$event["data"]["owner"],$event["data"]["title"],$event["data"]["startDate"],$event["data"]["endDate"],$event["data"]["description"],$event["data"]["location"],$event["data"]["borderColor"],$event["data"]["calendar"],$event["data"]['appid']);
            $event["data"] = $eventRetour->getArray();
        }
        error_log("broadcast");
        print_r($event);
        $topic->broadcast($event);
    }
}