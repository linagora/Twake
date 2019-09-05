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
            ->setName("twake:mapping")
            ->setDescription("Command add mapping in all index in Elasticsearch");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $mapping_workspace = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "name","group_id","creation_date"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "group_id" => Array("type" => "keyword"),
                "name" => Array("type" => "keyword"),
                "creation_date" => Array("type" => "date"),
            )
        );

        $mapping_group = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "name","creation_date"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "name" => Array("type" => "keyword"),
                "creation_date" => Array("type" => "date"),
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
                        "tags" => Array("type" => "text"),
                        "pinned" => Array("type" => "boolean"),
                        "reactions" => Array(
                            "type" => "nested",
                            "properties" => Array(
                                "reaction" => Array("type" => "text"),
                                "count" => Array("type" => "integer"),
                            )
                        )
                    )
                )
            )
        );


        $mapping_channel = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "workspace_id","name","group_id","last_activity"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "workspace_id" => Array("type" => "keyword"),
                "group_id" => Array("type" => "keyword"),
                "name" => Array("type" => "keyword"),
                "last_activity" => Array("type" => "integer")
            )
        );

        $mapping_file = Array(
            "_source" => Array(
                "includes" => Array("id"),
                "excludes" => Array(
                    "name","type","creation_date","workspace_id","keywords"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "name" => Array("type" => "keyword"),
                "type" => Array("type" => "keyword"),
                "creation_date" => Array("type" => "date"),
                "workspace_id" => Array("type" => "keyword"),
                "tags" => Array("type" => "text"),
                "keywords" => Array(
                    "type" => "nested",
                    "properties" => Array(
                        "keyword" => Array("type" => "text"),
                        "score" => Array("type" => "float")
                    )
                )
            )
        );
        $mapping_channel = json_encode($mapping_channel);
        $mapping_workspace = json_encode($mapping_workspace);
        $mapping_file=json_encode($mapping_file);
        $mapping_message_bloc = json_encode($mapping_message_bloc);
        $mapping_group = json_encode($mapping_group);
        $mapping_mail = json_encode($mapping_mail);


        $url = "http://albatros.twakeapp.com:9200/channel/_mapping/_doc";
        //$url = "http://51.68.94.194:9200/channel/_mapping/_doc";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_channel)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_channel);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);

        $url = "http://albatros.twakeapp.com:9200/group/_mapping/_doc";
        //$url = "http://51.68.94.194:9200/channel/_mapping/_doc";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_group)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_channel);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);

        $url = "http://albatros.twakeapp.com:9200/mail/_mapping/_doc";
        //$url = "http://51.68.94.194:9200/channel/_mapping/_doc";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_mail)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_channel);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
//
//        //$url = "http://51.68.94.194:9200/workspace/_mapping/_doc";
        $url = "http://albatros.twakeapp.com:9200/workspace/_mapping/_doc";


        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_workspace)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_workspace);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);

//        $url = "http://51.68.91.127:9200/drive_file/_mapping/_doc";
        $url = "http://albatros.twakeapp.com:9200/drive_file/_mapping/_doc";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_file)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_file);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);

        //$url = "http://51.68.91.127:9200/message_bloc/_mapping/_doc";
        $url = "http://albatros.twakeapp.com:9200/message_bloc/_mapping/_doc";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_file)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_message_bloc);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);

    }
}