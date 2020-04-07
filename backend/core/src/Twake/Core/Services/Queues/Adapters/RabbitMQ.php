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

    public function getChannel()
    {
        if (!$this->connection) {
            $this->connection = new AMQPStreamConnection($this->parameters["host"], $this->parameters["port"] ?: 5672, $this->parameters["username"], $this->parameters["password"]);
        }
        if (!$this->channel) {
            $this->channel = $connection->channel();
        }
        return $this->channel;
    }

    public function push($route, $message, $options = [])
    {
        $channel = $this->getChannel();
        $channel->queue_declare($route, false, true, false, false, [
            "x-message-ttl" => 24 * 60 * 60 * 1000 * (isset($options["delay"]) ? (20 * 365) : 1)
        ]);

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
        $channel->basic_publish($msg, '', $route);
    }

    public function consume($route, $should_ack = false, $max_messages = 10, $message_processing = 60)
    {
        $list = [];
        $callback = function ($msg) use ($max_messages, $list) {
            $list[] = $msg;
            if (count($list) >= $max_messages) {
                $this->stop_consume = true;
            }
            return true;
        };
        $this->stop_consume = false;
        $channel = $this->getChannel();
        $channel->queue_declare($route, false, true, false, false, ["x-message-ttl" => 24 * 60 * 60 * 1000]);
        $channel->basic_qos(null, $max_messages, null);
        $channel->basic_consume($route, '', false, !$should_ack, false, false, $callback);
        while ($channel->is_consuming() && !$this->stop_consume) {
            try {
                $channel->wait(null, false, 10);
            } catch (Exception $err) {
                //Timeout
            }
        }
        return $list;
    }

    public function getMessage($message)
    {
        return json_decode($message->body, true);
    }

    public function ack($route, $message)
    {
        $channel = $this->getChannel();
        $channel->queue_declare($route, false, true, false, false, ["x-message-ttl" => 24 * 60 * 60 * 1000]);
        $channel->ack($message->delivery_info['delivery_tag']);
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
