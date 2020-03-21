<?php


namespace Twake\Core\Services\Queues\Adapters;

use Aws\Common\Aws;
use Aws\Sqs\SqsClient;

class SQS implements QueueManager
{
    var $parameters = null;
    var $client = null;

    public function __construct($parameters)
    {
        $this->parameters = $parameters;
    }

    public function getChannel()
    {
        if (!$client) {
            $config = [
                'region' => $this->parameters["region"],
                'version' => $this->parameters["version"],
                'credentials' => [
                    'key' => $this->parameters["credentials"]["key"],
                    'secret' => $this->parameters["credentials"]["secret"]
                ]
            ];
            $client = new SqsClient($config);
        }
        return $client;
    }


    public function push($route, $message)
    {
        $client = $this->getChannel();
        $result = $client->createQueue(array('QueueName' => $route));
        $queueUrl = $result->get('QueueUrl');
        $client->sendMessage(array(
            'QueueUrl' => $queueUrl,
            'MessageBody' => json_encode($message),
        ));
    }

    public function consume($route, $should_ack = false, $max_messages = 10, $message_processing = 60)
    {
        $client = $this->getChannel();
        $result = $client->createQueue(array('QueueName' => $route));
        $queueUrl = $result->get('QueueUrl');
        $result = $client->receiveMessage(array(
            'QueueUrl' => $queueUrl,
            "MaxNumberOfMessages" => $max_messages,
            "VisibilityTimeout" => $message_processing,
        ));
        if ($should_ack == false) {
            $entries = [];
            foreach ($result->get("Messages") as $message) {
                $entries[] = [
                    "Id" => $message["MessageId"],
                    "ReceiptHandle" => $message["ReceiptHandle"]
                ];
            }
            $client->deleteMessageBatch(array(
                'QueueUrl' => $queueUrl,
                'Entries' => $entries
            ));
        }
        return $result->get("Messages");
    }

    public function ack($route, $message)
    {
        $client = $this->getChannel();
        $result = $client->createQueue(array('QueueName' => $route));
        $queueUrl = $result->get('QueueUrl');
        $client->deleteMessage(array(
            'QueueUrl' => $queueUrl,
            'ReceiptHandle' => $message["ReceiptHandle"]
        ));
    }

    public function getMessage($message)
    {
        return json_decode($message["Body"], true);
    }

    public function close()
    {
        return;
    }
}
