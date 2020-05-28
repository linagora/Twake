<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Twake\Core\Services\Queues\Scheduled;

class ScheduledNotificationsConsumeShard extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:scheduled_notifications_consume_shard");
    }


    protected function execute()
    {
        /** @var Scheduled $service */
        $service = $this->app->getServices()->get("app.queues_scheduled");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {
            $done = $service->consumeShardsFromRabbitMQ();
            if ($done == 0) {
                break;
            }
        }
    }

}