<?php

namespace Twake\Core\Command;

use Symfony\Bundle\Framework\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Discussion\Entity\Channel;
use Twake\Market\Entity\LinkAppWorkspace;
use Twake\Workspaces\Entity\Level;


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