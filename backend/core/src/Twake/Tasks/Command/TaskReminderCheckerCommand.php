<?php

namespace Twake\Tasks\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;


class TaskReminderCheckerCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    protected function configure()
    {
        $this
            ->setName("twake:tasks_check_reminders");
    }


    protected function execute()
    {

        $services = $this->getApp()->getServices();

        $services->get("app.tasks.task")->checkReminders();

        @posix_kill(posix_getpid(), SIGKILL);

    }


}