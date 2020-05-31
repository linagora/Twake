<?php

namespace Twake\Calendar\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;


class ReminderCheckerCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this->setName("twake:calendar_check_reminders");
    }


    protected function execute()
    {
        $services = $this->getApp()->getServices();

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {
            $sent = $services->get("app.calendar.event")->checkReminders();
            if ($sent == 0) {
                sleep(30);
            }
        }
    }


}