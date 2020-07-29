<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Twake\Core\Services\Queues\Scheduled;

class ScheduledNotificationsConsumeTimetable extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:scheduled_notifications_consume_timetable");
    }


    protected function execute()
    {
        /** @var Scheduled $service */
        $service = $this->app->getServices()->get("app.queues_scheduled");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {
            $service->consumeShards(60);
            usleep(100000);
        }
    }

}