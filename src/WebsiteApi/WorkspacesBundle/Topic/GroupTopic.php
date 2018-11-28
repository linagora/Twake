<?php

/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 30/06/2017
 * Time: 14:10
 */
namespace WebsiteApi\WorkspacesBundle\Topic;

use Gos\Bundle\WebSocketBundle\Topic\TopicInterface;
use Gos\Bundle\WebSocketBundle\Topic\PushableTopicInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\Topic;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;

class GroupTopic implements TopicInterface, PushableTopicInterface {

    public function __construct($clientManipulator)
    {
        $this->clientManipulator = $clientManipulator;
  }

  public function getName() {return 'group.topic';}

  public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
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

  //Post d'une update
  public function onPush(Topic $topic, WampRequest $request, $data, $provider)
  {
    $topic->broadcast($data);
  }

  public function onSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request) {
  }

  public function onUnSubscribe(ConnectionInterface $connection, Topic $topic, WampRequest $request) {
  }
}