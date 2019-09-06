<?php
namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Output\OutputInterface;


class MappingCommand extends ContainerAwareCommand
{


    protected function configure()
    {
        $this
            ->setName("twake:reindex")
            ->setDescription("Command to reindex scylladb date in all index in Elasticsearch");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $doctrine = $this->getContainer()->get('doctrine');
        $manager = $doctrine->getManager();

        $workspaces = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array());
        //var_dump(sizeof($workspaces));
        foreach ($workspaces as $workspace) {
            //var_dump($workspace->getMembers()->getAsArray());
            $manager->es_put($workspace, $workspace->getEsType());
        }

        $apps = $manager->getRepository("TwakeMarketBundle:Application")->findBy(Array());
        foreach ($apps as $app) {
            $manager->es_put($app, $app->getEsType());
        }

        $files = $manager->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
        foreach ($files as $file){
            $manager->es_put($file, $file->getEsType());
        }


        $channels= $manager->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
        foreach ($channels as $channel){
            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
            {
                //var_dump(gettype($channel->getAsArray()["last_activity"]));
                $manager->es_put($channel,$channel->getEsType());
            }
        }
    }
}