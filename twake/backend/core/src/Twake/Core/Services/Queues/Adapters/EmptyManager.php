<?php


namespace Twake\Core\Services\Queues\Adapters;

class EmptyManager implements QueueManager
{
    var $parameters = null;
    var $client = null;

    public function __construct()
    {
    }

    public function getChannel()
    {
    }

    public function push($route, $message, $options = [])
    {
    }

    public function consume($route, $callback, $options)
    {
      return true;
    }

    public function oldConsume($route, $should_ack = false, $max_messages = 10, $message_processing = 60)
    {
      return [];
    }

    public function ack($route, $message)
    {

    }

    public function getMessage($message)
    {
      return [];
    }

    public function close()
    {
        return;
    }
}
