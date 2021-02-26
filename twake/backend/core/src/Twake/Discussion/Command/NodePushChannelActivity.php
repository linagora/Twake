<?php

namespace Twake\Discussion\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Services\Queues\Adapters\QueueManager;

class NodePushChannelActivity extends ContainerAwareCommand
{

    var $parameters = [];

    protected function configure()
    {
        $this->setName("twake:node:push_channel_activity");
    }

    protected function execute()
    {

        $services = $this->getApp()->getServices();
        $em = $services->get('app.twake_doctrine');
        /** @var QueueManager $queues */
        $queues = $services->get('app.queues')->getAdapter();
        $messagesService = $services->get("app.messages");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {

            $queues->consume("channel:activity_message", function ($queue_message) use($messagesService, $queues, $em) {

                $push_message = $queues->getMessage($queue_message);

                $object = [
                    "channel_id" => $push_message["channel_id"],
                    "parent_message_id" => "",
                    "content" => "",
                    "hidden_data" => [
                        "type" => "activity",
                        "activity" => $push_message["activity"]
                    ],
                ];

                $messagesService->save($object, []);
                $queues->ack("channel:activity_message", $queue_message, ["exchange_type" => "fanout"]);
            
            }, ["max_messages" => 10, "should_ack" => true, "exchange_type" => "fanout"]);

        }

    }

}
