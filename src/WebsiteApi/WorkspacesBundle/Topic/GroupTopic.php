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

  public function __construct()
  {
  }

  public function getName() {return 'group.topic';}
  //Réception d'un truc (pas utile pour le moment)
  public function onPublish(ConnectionInterface $connection, Topic $topic, WampRequest $request, $event, array $exclude, array $eligible)
  {
    // TODO: Implement onPublish() method.
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