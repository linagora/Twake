<?php

namespace WebsiteApi\_old_CalendarBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use \DateTime;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;


class CalendarSynchronizationCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this
            ->setName("twake:calendar_synchronization");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $services = $this->getApplication()->getKernel()->getContainer();

        $services->get("app.export_import")->updateCalendarsByLink();
    }


}