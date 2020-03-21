<?php


namespace Twake\Core\Services\Queues\Adapters;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

interface QueueManager
{

    public function getChannel();

    public function push($route, $message);

    public function consume($route, $should_ack = false, $max_messages = 50, $message_processing = 60);

    public function getMessage($message);

    public function ack($route, $message);

    public function close();

}
