<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Entity\MailTask;
use Twake\Core\Services\Queues\Adapters\QueueManager;

// Configuration
use Pusher\Adapter\AdapterInterface;
use Pusher\Adapter\Apns;
use Pusher\Adapter\Fcm;
use Pusher\Collection\DeviceCollection;
use Pusher\Model\Device;
use Pusher\Model\Push;
use Pusher\Pusher;


class MailsQueueCommand extends ContainerAwareCommand
{

    var $parameters = [];

    protected function configure()
    {
        $this->setName("twake:mails_queue");
    }

    protected function execute()
    {

        $services = $this->getApp()->getServices();
        $em = $services->get('app.twake_doctrine');
        $repo = $em->getRepository("Twake\Core:MailTask");
        /** @var QueueManager $queues */
        $queues = $services->get('app.queues')->getAdapter();
        $mailer = $services->get("app.twake_mailer");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {

            $messages = $queues->oldConsume("mails", true);

            if (count($messages) == 0) {
                sleep(1);
            } else {


                foreach ($messages as $queue_message) {
                    $push_message = $queues->getMessage($queue_message);

                    $data = $push_message;

                    if ($data) {

                        $id = $data["task_id"];

                        /** @var MailTask $task */
                        $task = $repo->find($id);

                        //Ack anyway, we do not retry email sending
                        $queues->ack("mails", $queue_message);

                        if ($task) {
                            $task_data = $task->getData();
                            $mailer->sendInternal($task_data["mail"], $task_data["template"], $task_data["data"], $task_data["attachments"], $task_data["templateDirectory"]);
                            $em->remove($task);
                        }

                    }


                }

                $em->flush($task);

            }

        }


    }

}
