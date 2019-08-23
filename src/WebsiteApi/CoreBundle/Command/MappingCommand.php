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
                    "name","group_id"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "group_id" => Array("type" => "keyword"),
                "name" => Array("type" => "keyword")
            )
        );

        $mapping_message_bloc = Array(
            "_source" => Array(
                "includes" => Array("id","date_first","date_last","reaction"),
                "excludes" => Array(
                    "workspace_id","channel_id","content"
                )
            ),
            "properties" => Array(
                "id" => Array("type" => "keyword"),
                "workspace_id" => Array("type" => "keyword"),
                "channel_id" => Array("type" => "keyword"),
                "date_first" => Array("type" => "date"),
                "date_last" => Array("type" => "date"),
                "content" => Array("type" => "text"),
                "reaction" => Array("type" => "text"),
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

//
//        $url = "http://albatros.twakeapp.com:9200/channel/_mapping/_doc";
//        //$url = "http://51.68.94.194:9200/channel/_mapping/_doc";
//
//        $ch = curl_init();
//        curl_setopt($ch, CURLOPT_URL, $url);
//        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_channel)));
//        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
//        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_channel);
//        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
//        curl_exec($ch);
//        curl_close($ch);
////
////        //$url = "http://51.68.94.194:9200/workspace/_mapping/_doc";
//        $url = "http://albatros.twakeapp.com:9200/workspace/_mapping/_doc";
//
//
//        $ch = curl_init();
//        curl_setopt($ch, CURLOPT_URL, $url);
//        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_workspace)));
//        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
//        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_workspace);
//        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
//        curl_exec($ch);
//        curl_close($ch);
//
////        $url = "http://51.68.91.127:9200/drive_file/_mapping/_doc";
//        $url = "http://albatros.twakeapp.com:9200/drive_file/_mapping/_doc";
//
//        $ch = curl_init();
//        curl_setopt($ch, CURLOPT_URL, $url);
//        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_file)));
//        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
//        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_file);
//        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
//        curl_exec($ch);
//        curl_close($ch);
        error_log("debut mapping");
        $url = "http://51.68.91.127:9200/message_bloc/_mapping/_doc";
        //$url = "http://albatros.twakeapp.com:9200/message_bloc/_mapping/_doc";

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