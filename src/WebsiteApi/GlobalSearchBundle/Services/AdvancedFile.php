<?php


namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;


class AdvancedFile
{
    private $doctrine;
    private $fileservice;
    private $workspaceservice;
    private $globalresult;

    public function __construct($doctrine, $fileservice, $workspaceservice)
    {
        $this->doctrine = $doctrine;
        $this->fileservice = $fileservice;
        $this->workspaceservice = $workspaceservice;

    }


    public function AdvancedFile($current_user_id, $options, $workspaces)
    {
        //Prepare parameters
        if (!$options["title"]) {
            $options["title"] = $options["name"];
        }

        $workspace_access = [];
        if (!$workspaces && !is_array($workspaces)) {
            $workspace_access_tmp = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("user" => $current_user_id));
            foreach ($workspace_access_tmp as $wp) {
                $workspace_access[] = $wp->getWorkspace();
            }
        } else {
            foreach ($workspaces as $wp) {
                $wp_entity = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace" => $wp->getId(), "user" => $current_user_id));
                if ($wp_entity) {
                    $workspace_access[] = $wp;
                }
            }
        }
        $workspaces = $workspace_access;

        $workspaces_ids = [];
        foreach ($workspaces as $wp) {
            if (!is_string($wp)) {
                if (is_array($wp)) {
                    $wp = $wp["id"];
                } else {
                    $wp = $wp->getId();
                }
            }
            $workspaces_ids[] = $wp;
        }
        $workspaces = $workspaces_ids;

        //on regarde avant l'acces pour ne faire qu'une requete sur ES et pour pouvoir profitier de l'ordonnocement par pertinence
        if (isset($workspace_access) && $workspace_access != Array()) {

            $must = Array();

            ESUtils::createShouldMatch($workspaces, "workspace_id", 1, $must);

            $name = isset($options["name"]) ? preg_filter('/($|^)/', '.*', explode(" ", $options["name"])) : false;
            ESUtils::createNestedRegexShouldMatch($name, "keywords.keyword", "all", $must);

            $tags = isset($options["tags"]) ? $options["tags"] : false;
            ESUtils::createShouldMatch($tags, "tags", "all", $must);

            $size_lte = isset($options["size_lte"]) ? $options["size_lte"] : false;
            $size_gte = isset($options["size_gte"]) ? $options["size_gte"] : false;
            ESUtils::createRange($size_gte, $size_lte, "size", $must);

            $create_before = isset($options["date_create_before"]) ? $options["date_create_before"] : false;
            $create_after = isset($options["date_create_after"]) ? $options["date_create_after"] : false;
            ESUtils::createRange($create_after, $create_before, "creation_date", $must);

            $modified_before = isset($options["date_modified_before"]) ? $options["date_modified_before"] : false;
            $modified_after = isset($options["date_modified_after"]) ? $options["date_modified_after"] : false;
            ESUtils::createRange($modified_after, $modified_before, "date_last_modified", $must);


            $creator = isset($options["creator"]) ? $options["creator"] : false;
            ESUtils::createMatchPhrase($creator, "creator", $must);


            $type = isset($options["type"]) ? $options["type"] : false;
            ESUtils::createMatchPhrase($type, "type", $must);

            $options = Array(
                "repository" => "TwakeDriveBundle:DriveFile",
                "index" => "drive_file",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "must" => $must
                    )
                )
            );

            $result = $this->doctrine->es_search($options);

            //On traite les données recu d'Elasticsearch
            foreach ($result["result"] as $file) {
                $this->list_files["results"][] = Array(
                    "file" => $file[0]->getAsArray(),
                    "type" => "file",
                    "score" => $file[1][0],
                    "workspace" => false, //TODO
                );
            }

            $scroll_id = $result["scroll_id"];
            $this->list_files["scroll_id"] = $scroll_id;

            $this->list_files["es"] = $options;

            return $this->list_files;
        }
    }

}