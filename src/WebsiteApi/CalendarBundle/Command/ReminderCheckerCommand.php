<?php

namespace WebsiteApi\CalendarBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use \DateTime;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;


class ReminderCheckerCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    protected function configure()
    {
        $this
            ->setName("twake:calendar_check");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $services = $this->getApplication()->getKernel()->getContainer();

        $services->get("app.calendar_events")->checkReminders();

        posix_kill(posix_getpid(), SIGKILL);

    }


}