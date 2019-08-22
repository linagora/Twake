<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

class Mapping
{

    public function Mapping(){

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

        //var_dump($mapping_channel);

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
//
//        //$url = "http://51.68.94.194:9200/workspace/_mapping/_doc";
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

        $url = "http://51.68.91.127:9200/drive_file/_mapping/_doc";
//        $url = "http://albatros.twakeapp.com:9200/drive_file/_mapping/_doc";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: application/json','Content-Length: ' . strlen($mapping_file)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS,$mapping_file);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);

    }

}