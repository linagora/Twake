<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\Level;


class TestZMQCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:testzmq")
            ->setDescription("Test ZMQ");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {

        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApplication()->getKernel()->getContainer();

        $routes = ["group/", "connections/", "sharing_view/", "calendar/workspace/", "calendar/", "discussion/"];

        for ($i = 0; $i < 100000; $i++) {

            $r = $routes[random_int(0, count($routes) - 1)] . random_int(0, 100);
            error_log("push " . $i . " -> " . $r);
            $services->get("app.pusher")->push(Array("action" => "update"), "drive/4");

        }

    }

}