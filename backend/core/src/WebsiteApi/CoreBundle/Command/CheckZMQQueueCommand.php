<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\Level;


class CheckZMQQueueCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:check_zmq_queue")
            ->setDescription("Check ZMQ messages to send");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $services = $this->getApplication()->getKernel()->getContainer();

        $start = microtime(true);
        $time_elapsed_secs = 0;

        while ($time_elapsed_secs < 60) {
            sleep(1);
            $services->get("app.pusher")->checkQueue();
            $time_elapsed_secs = microtime(true) - $start;
        }
        return true;

    }

}