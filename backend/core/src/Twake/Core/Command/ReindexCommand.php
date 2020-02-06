<?php

namespace Twake\Core\Command;

use Symfony\Bundle\Framework\Command\ContainerAwareCommand;
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

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $manager = $this->getContainer()->get('app.twake_doctrine');

        $channels = $manager->getRepository("TwakeChannels:Channel")->findBy(Array("direct" => true));
        foreach ($channels as $i => $channel) {
            $c = $this->indexChannel($channel, $manager);
            error_log("index " . "Direct Channels " . $i . "/" . count($channels) . " " . $c . " messsages");
        }
        $channels = $manager->getRepository("TwakeChannels:Channel")->findBy(Array("direct" => false));
        foreach ($channels as $i => $channel) {
            $c = $this->indexChannel($channel, $manager);
            error_log("index " . "Workspaces Channels " . $i . "/" . count($channels) . " " . $c . " messsages");
        }

        $this->indexRepository("TwakeWorkspaces:Workspace");

        $this->indexRepository("TwakeWorkspaces:Group");

        $workspaces = $manager->getRepository("TwakeWorkspaces:Workspace")->findBy(Array());
        error_log("index " . "Files");
        foreach ($workspaces as $workspace) {
            $this->indexRepository("TwakeDrive:DriveFile", Array("workspace_id" => $workspace->getId()));
        }

        error_log("index " . "TwakeChannels:Channel");
        $channels = $manager->getRepository("TwakeChannels:Channel")->findBy(Array());
        error_log("   -> " . count($channels));
        foreach ($channels as $channel) {
            if ($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false) {
                $manager->es_put($channel, $channel->getEsType());
            }
        }

        $this->indexRepository("TwakeMarket:Application");

        $this->indexRepository("TwakeGlobalSearch:Bloc");

        $this->indexRepository("TwakeUsers:Mail");

        $this->indexRepository("TwakeUsers:User");

        $this->indexRepository("TwakeTasks:Task");

        $this->indexRepository("TwakeCalendar:Event");


    }

    private function indexChannel($channel, $manager)
    {

        $messages = $manager->getRepository("TwakeDiscussion:Message")->findBy(Array("channel_id" => $channel->getId()));
        foreach ($messages as $message) {
            $this->getContainer()->get('app.messages')->indexMessage($message, $channel->getOriginalWorkspaceId(), $channel->getId());
        }

        return count($messages);

    }

    private function indexRepository($repository, $options = Array())
    {
        $manager = $this->getContainer()->get('app.twake_doctrine');

        error_log("index " . $repository);

        $items = $manager->getRepository($repository)->findBy($options);
        error_log("   -> " . count($items));
        foreach ($items as $item) {
            $manager->es_put($item, $item->getEsType());
        }

    }
}
