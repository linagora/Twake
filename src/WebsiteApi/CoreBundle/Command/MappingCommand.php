<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;


class MappingCommand extends ContainerAwareCommand
{


    protected function configure()
    {
        $this
            ->setName("twake:mapping")
            ->setDescription("Command add mapping in all index in Elasticsearch");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $mapping_workspace = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "name", "group_id", "creation_date"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "group_id" => Array("type" => "keyword"),
                "name" => Array("type" => "text"),
                "creation_date" => Array("type" => "date")
            )
        );

        $mapping_group = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "name", "creation_date"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "name" => Array("type" => "text"),
                "creation_date" => Array("type" => "date")
            )
        );

        $mapping_mail = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "mail"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "mail" => Array("type" => "keyword")
            )
        );

        $mapping_message_bloc = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "workspace_id", "channel_id", "messages"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "workspace_id" => Array("type" => "keyword"),
                "channel_id" => Array("type" => "keyword"),
                "messages" => Array(
                    "type" => "nested",
                    "properties" => Array(
                        "content" => Array("type" => "text"),
                        "sender" => Array("type" => "keyword"),
                        "application_id" => Array("type" => "keyword"),
                        "mentions" => Array("type" => "text"),
                        "date" => Array("type" => "date"),
                        "tags" => Array("type" => "keyword"),
                        "pinned" => Array("type" => "boolean"),
                        "reactions" => Array("type" => "keyword")
                    )
                )
            )
        );

        $mapping_task = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "title", "description", "owner", "before", "start", "date_created", "tags", "participants", "workspace_id", "date_last_modified"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "title" => Array("type" => "text"),
                "description" => Array("type" => "text"),
                "owner" => Array("type" => "keyword"),
                "tags" => Array("type" => "keyword"),
                "before" => Array("type" => "date"),
                "start" => Array("type" => "date"),
                "date_created" => Array("type" => "date"),
                "date_last_modified" => Array("type" => "date"),
                "workspace_id" => Array("type" => "keyword"),
                "participants" => Array("type" => "keyword")
            )
        );

        $mapping_event = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "title", "description", "owner", "date_from", "date_to", "tags", "participants", "workspace_id", "date_last_modified"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "title" => Array("type" => "text"),
                "description" => Array("type" => "text"),
                "owner" => Array("type" => "keyword"),
                "tags" => Array("type" => "keyword"),
                "date_from" => Array("type" => "date"),
                "date_to" => Array("type" => "date"),
                "date_last_modified" => Array("type" => "date"),
                "participants" => Array("type" => "keyword"),
                "workspace_id" => Array("type" => "keyword")
            )
        );


        $mapping_channel = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "workspace_id", "name", "group_id", "last_activity"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "workspace_id" => Array("type" => "keyword"),
                "group_id" => Array("type" => "keyword"),
                "name" => Array("type" => "text"),
                "last_activity" => Array("type" => "integer")
            )
        );

        $mapping_file = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "name", "type", "creation_date", "workspace_id", "keywords", "creator", "date_last_modified", "tags", "size")
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "name" => Array("type" => "text"),
                "type" => Array("type" => "keyword"),
                "creation_date" => Array("type" => "date"),
                "creator" => Array("type" => "keyword"),
                "date_last_modified" => Array("type" => "date"),
                "workspace_id" => Array("type" => "keyword"),
                "tags" => Array("type" => "keyword"),
                "size" => Array("type" => "integer"),
                "keywords" => Array(
                    "type" => "nested",
                    "properties" => Array(
                        "keyword" => Array("type" => "text"),
                        "score" => Array("type" => "float")
                    )
                )
            )
        );

        $mapping_users = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "firstname", "lastname", "username", "language", "creation_date"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "firstname" => Array("type" => "text"),
                "lastname" => Array("type" => "text"),
                "username" => Array("type" => "text"),
                "language" => Array("type" => "keyword"),
                "creation_date" => Array("type" => "date")
            )
        );


        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/task";
        $this->updateMapping($url, $mapping_task, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/event";
        $this->updateMapping($url, $mapping_event, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/channel";
        $this->updateMapping($url, $mapping_channel, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/group";
        $this->updateMapping($url, $mapping_group, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/mail";
        $this->updateMapping($url, $mapping_mail, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/workspace";
        $this->updateMapping($url, $mapping_workspace, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/users";
        $this->updateMapping($url, $mapping_users, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/drive_file";
        $this->updateMapping($url, $mapping_file, "/_mapping/_doc");

        $url = $this->getContainer()->getParameter('ELASTIC_SERVER') . "/message_bloc";
        $this->updateMapping($url, $mapping_message_bloc, "/_mapping/_doc");

    }

    private function updateMapping($url, $mapping, $mapping_suffix)
    {

        error_log($url . $mapping_suffix);

        try {
            $this->getContainer()->get("twake.restclient")->put("http://" . $url, "");
        } catch (\Exception $e) {

        }

        $mapping = json_encode($mapping);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "http://" . $url . $mapping_suffix);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Content-Length: ' . strlen($mapping)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $mapping);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_VERBOSE, 0);
        $result = curl_exec($ch);
        curl_close($ch);

        error_log($result);
        error_log("---------------");
    }
}