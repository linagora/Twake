<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Services\DoctrineAdapter\FakeCassandraTimeuuid;
use Twake\Discussion\Entity\Channel;
use Twake\Market\Entity\Application;
use Twake\Market\Entity\LinkAppWorkspace;
use Twake\Workspaces\Entity\Level;

class GetRoutesCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:routes");
    }


    protected function execute()
    {
        foreach ($this->app->getRouting()->getRoutes() as $route) {
            error_log($route);
        }
    }

}