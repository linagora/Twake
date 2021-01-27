<?php


namespace Twake\Core\Services\Queues\Adapters;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class RabbitMQ implements QueueManager
{

    var $parameters = null;
    var $connection = null;
    var $channel = null;
    var $stop_consume = false;

    public function __construct($parameters)
    {
        $this->parameters = $parameters;
    }

    public function getChannel($options = [])
    {
        if (!$this->connection) {
            $this->connection = new AMQPStreamConnection($this->parameters["host"], $this->parameters["port"] ?: 5672, $this->parameters["username"], $this->parameters["password"], $this->parameters["vhost"] ?: '/');
        }
        if (!$this->channel) {
            $this->channel = $this->connection->channel();
        }
        return $this->channel;
    }

    public function push($route, $message, $options = [])
    {   
        $amqp_options = [];
        if (isset($options["delay"])) {
            $amqp_options = [
                'delivery_mode' => 2, # make message persistent
                'application_headers' => new AMQPTable([
                    'x-delay' => max(0, $options["delay"] * 1000)
                ])
            ];
            $data["DelaySeconds"] = $options["delay"];
        }

        $msg = new AMQPMessage(json_encode($message), $amqp_options);


        $channel = $this->getChannel();
        if($options["exchange_type"]){
            $channel->queue_declare($route, false, true, false, false);
            $channel->exchange_declare($route, $options["exchange_type"], false, true, false);
            $channel->basic_publish($msg, $route, $route);
        }else{
            $channel->queue_declare($route, false, true, false, false, [
                "x-message-ttl" => 24 * 60 * 60 * 1000
            ]);
            $channel->basic_publish($msg, '', $route);
        }
    }

    public function consume($route, $should_ack = false, $max_messages = 10, $message_processing = 60, $options = [])
    {
        $list = [];
        $callback = function ($msg) use ($max_messages, &$list) {
            $list[] = $msg;
            if (count($list) >= $max_messages) {
                $this->stop_consume = true;
            }
            return true;
        };
        $this->stop_consume = false;
        $channel = $this->getChannel();

        if($options["exchange_type"]){
            $channel->queue_declare($route, false, true, false, false);
            $channel->exchange_declare($route, $options["exchange_type"], false, true, false);
            $channel->basic_qos(null, $max_messages, null);
            $channel->basic_consume($route, $route, false, !$should_ack, false, false, $callback);
        }else{
            $channel->queue_declare($route, false, true, false, false, [
                "x-message-ttl" => 24 * 60 * 60 * 1000
            ]);
            $channel->basic_qos(null, $max_messages, null);
            $channel->basic_consume($route, '', false, !$should_ack, false, false, $callback);
        }

        try {
          while ($channel->is_consuming() && !$this->stop_consume) {
                  $channel->wait(null, false, 5);
          }
        } catch (\Exception $err) {
          error_log($err->getMessage());
        }
        return $list;
    }

    public function getMessage($message)
    {
        return json_decode($message->body, true);
    }

    public function ack($route, $message, $options = [])
    {
        $channel = $this->getChannel();

        if($options["exchange_type"]){
            $channel->queue_declare($route, false, true, false, false);
            $channel->exchange_declare($route, $options["exchange_type"], false, true, false);
        }else{
            $channel->queue_declare($route, false, true, false, false, [
                "x-message-ttl" => 24 * 60 * 60 * 1000
            ]);
        }
        $message->delivery_info['channel']->basic_ack($message->delivery_info['delivery_tag']);
    }

    public function close()
    {
        if ($this->channel) {
            $this->channel->close();
        }
        if ($this->connection) {
            $this->connection->close();
        }
    }

}
