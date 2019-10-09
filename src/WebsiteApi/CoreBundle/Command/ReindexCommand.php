<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Output\OutputInterface;


class ReindexCommand extends ContainerAwareCommand
{


    protected function configure()
    {
        $this
            ->setName("twake:reindex")
            ->setDescription("Command to reindex scylladb date in all index in Elasticsearch");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $manager = $this->getContainer()->get('app.twake_doctrine');

        $this->indexRepository("TwakeWorkspacesBundle:Workspace");

        //
//        $apps = $manager->getRepository("TwakeMarketBundle:Application")->findBy(Array());
//        foreach ($apps as $app) {
//            $manager->es_put($app, $app->getEsType());
//        }
//
//        $files = $manager->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
//        foreach ($files as $file){
//            $manager->es_put($file, $file->getEsType());
//        }
//
//
//        $channels= $manager->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel){
//            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
//            {
//                $manager->es_put($channel,$channel->getEsType());
//            }
//        }
//
//        $groups = $manager->getRepository("TwakeWorkspacesBundle:Group")->findBy(Array());
//        foreach ($groups as $group){
//            $manager->es_put($group, $group->getEsType());
//        }
//
//        $workspaces = $manager->getRepository("TwakeWorkspacesBundle:Workspaces")->findBy(Array());
//        foreach ($workspaces as $workspace){
//            $manager->es_put($workspace, $workspace->getEsType());
//        }
//
//        $mails = $manager->getRepository("TwakeUsersBundle:Mail")->findBy(Array());
//        foreach ($mails as $mail){
//            $manager->es_put($mail, $mail->getEsType());
//        }

        $this->indexRepository("TwakeUsersBundle:User");

        $this->indexRepository("TwakeTasksBundle:Task");

        $this->indexRepository("TwakeCalendarBundle:Event");

    }

    private function indexRepository($repository)
    {
        $manager = $this->getContainer()->get('app.twake_doctrine');

        error_log("index " . $repository);

        $items = $manager->getRepository($repository)->findBy(Array());
        error_log("   -> " . count($items));
        foreach ($items as $item) {
            $manager->es_put($item, $item->getEsType());
        }

    }
}