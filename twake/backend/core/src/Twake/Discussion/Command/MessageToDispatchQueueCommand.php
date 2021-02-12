<?php

namespace Twake\Discussion\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Services\Queues\Adapters\QueueManager;

// Configuration
use Pusher\Adapter\AdapterInterface;
use Pusher\Adapter\Apns;
use Pusher\Adapter\Fcm;
use Pusher\Collection\DeviceCollection;
use Pusher\Model\Device;
use Pusher\Model\Push;
use Pusher\Pusher;


class MessageToDispatchQueueCommand extends ContainerAwareCommand
{

    var $parameters = [];

    protected function configure()
    {
        $this->setName("twake:message_dispatch_queue");
    }

    protected function execute()
    {

        $services = $this->getApp()->getServices();
        $em = $services->get('app.twake_doctrine');
        $message_system = $services->get('app.messages');
        /** @var QueueManager $queues */
        $queues = $services->get('app.queues')->getAdapter();

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {

            $messages = $queues->oldConsume("message_dispatch_queue", true);

            if (count($messages) == 0) {
                sleep(1);
            } else {

                foreach ($messages as $queue_message) {

                    $dispatch_informations = $queues->getMessage($queue_message);
                    $channel = $dispatch_informations["channel"];
                    $application_id = $dispatch_informations["application_id"];
                    $user_id = $dispatch_informations["user_id"];
                    $message_id = $dispatch_informations["message_id"];
                    
                    try{
                        $message_system->dispatchMessage(
                            $channel,
                            $application_id,
                            $user_id,
                            $message_id
                        );
                    }catch(\Exception $e){
                        error_log($e->getMessage());
                    }

                    $queues->ack("message_dispatch_queue", $queue_message);
                }


            }
        }

    }

}