<?php


namespace Twake\Core\Services\Queues\Adapters;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

interface QueueManager
{

    public function getChannel();

    public function push($route, $message, $options = []);

    public function consume($route, $callback, $options);

    public function oldConsume($route, $should_ack = false, $max_messages = 10, $message_processing = 60);

    public function getMessage($message);

    public function ack($route, $message);

    public function close();

}
