<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Services\Queues\Adapters\QueueManager;
use Twake\Core\Services\Queues\Queues;
use Twake\Market\Entity\Application;
use Twake\Workspaces\Entity\Group;


class TestQueue extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    protected function configure()
    {
        $this
            ->setName("twake:queue:test");
    }


    protected function execute()
    {

        error_log("test queue");

        /** @var QueueManager $queues */
        $queues = $this->getApp()->getServices()->get('app.queues')->getAdapter();

        $queues->push("test", Array("message" => "coucou"));

        sleep(10);

        error_log(json_encode($queues->oldConsume("test")));

    }


}