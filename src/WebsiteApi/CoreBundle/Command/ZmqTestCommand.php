<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\Level;


class ZmqTestCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:zmqtest");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $services = $this->getApplication()->getKernel()->getContainer();

        $data = Array(
            "type" => "update",
            "calendar" => ""
        );
        error_log(getmypid());

        for ($i = 0; $i < 1; $i++) {

            error_log("WILL PUSH");
            $services->get("app.pusher")->push($data, "notifications/5");
            error_log("PUSHED");

        }


        $services->get("gos_web_socket.zmq.pusher")->close();

        exit();

    }
}