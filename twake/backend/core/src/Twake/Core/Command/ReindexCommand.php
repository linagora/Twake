<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;


class ReindexCommand extends ContainerAwareCommand
{


    protected function configure()
    {
        $this
            ->setName("twake:reindex")
            ->setDescription("Command to reindex scylladb date in all index in Elasticsearch");
    }

    protected function execute()
    {
        $manager = $this->getApp()->getServices()->get('app.twake_doctrine');

        $arg_list = $_SERVER['argv'];
        $arg = isset($arg_list[0]) ? $arg_list[0] : false;

        error_log("REINDEX ".$arg);

        if($arg == "channel"){
            $channels = $manager->getRepository("Twake\Channels:Channel")->findBy(Array("direct" => false));
            foreach ($channels as $i => $channel) {
                $c = $this->indexChannel($channel, $manager);
                error_log("index " . "Workspaces Channels " . $i . "/" . count($channels) . " " . $c . " messsages");
            }
        }

        if($arg == "workspace"){
            $this->indexRepository("Twake\Workspaces:Workspace");
        }

        if($arg == "group"){
            $this->indexRepository("Twake\Workspaces:Group");
        }

        if($arg == "file"){
            $workspaces = $manager->getRepository("Twake\Workspaces:Workspace")->findBy(Array());
            error_log("index " . "Files");
            foreach ($workspaces as $workspace) {
                $this->indexRepository("Twake\Drive:DriveFile", Array("workspace_id" => $workspace->getId()));
            }
        }

        if($arg == "application"){
            $this->indexRepository("Twake\Market:Application");
        }

        if($arg == "message"){
            $this->indexRepository("Twake\GlobalSearch:Bloc");
        }

        if($arg == "mail"){
            $this->indexRepository("Twake\Users:Mail");
        }

        if($arg == "user"){
            $this->indexRepository("Twake\Users:User");
        }

        if($arg == "task"){
            $this->indexRepository("Twake\Tasks:Task");
        }

        if($arg == "event"){
            $this->indexRepository("Twake\Calendar:Event");
        }


    }

    private function indexChannel($channel, $manager)
    {

        $messages = $manager->getRepository("Twake\Discussion:Message")->findBy(Array("channel_id" => $channel->getId()));
        foreach ($messages as $message) {
            $this->getApp()->getServices()->get('app.messages')->indexMessage($message, $channel->getOriginalWorkspaceId(), $channel->getId());
        }

        return count($messages);

    }

    private function indexRepository($repository, $options = Array())
    {
        $manager = $this->getApp()->getServices()->get('app.twake_doctrine');

        error_log("index " . $repository);

        $items = $manager->getRepository($repository)->findBy($options);
        error_log("   -> " . count($items));
        $i = 0;
        foreach ($items as $item) {
            if(($i++) % 100 == 0) error_log($i);
            $manager->es_put($item, $item->getEsType());
        }

    }
}
