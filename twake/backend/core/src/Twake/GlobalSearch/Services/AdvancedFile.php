<?php


namespace Twake\GlobalSearch\Services;

use App\App;

class AdvancedFile
{
    private $doctrine;
    private $workspaceservice;
    private $globalresult;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->workspaceservice = $app->getServices()->get("app.workspaces");

    }


    public function AdvancedFile($current_user_id, $options, $workspaces)
    {
        $known_workspaces_by_id = Array();

        //Prepare parameters
        if (!$options["name"]) {
            $options["name"] = $options["title"];
        }

        $workspace_access = [];
        if (!$workspaces && !is_array($workspaces)) {
            $workspace_access_tmp = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findBy(Array("user_id" => $current_user_id));
            foreach ($workspace_access_tmp as $wp) {
                $workspace_access[] = $wp->getWorkspace($this->doctrine);
            }
        } else {
            foreach ($workspaces as $wp) {
                if (!is_string($wp)) {
                    if (is_array($wp)) {
                        $known_workspaces_by_id[$wp["id"]] = $wp;
                        $wp = $wp["id"];
                    } else {
                        $known_workspaces_by_id[$wp->getId()] = $wp->getAsArray();
                        $wp = $wp->getId();
                    }
                }
                $wp_entity = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findOneBy(Array("workspace_id" => $wp, "user_id" => $current_user_id));
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
                    $known_workspaces_by_id[$wp["id"]] = $wp;
                    $wp = $wp["id"];
                } else {
                    $known_workspaces_by_id[$wp->getId()] = $wp->getAsArray();
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

            $create_before = (isset($options["date_create_before"]) && $options["date_create_before"]) ? date('Y-m-d', intval($options["date_create_before"])) : false;
            $create_after = (isset($options["date_create_after"]) && $options["date_create_after"]) ? date('Y-m-d', intval($options["date_create_after"])) : false;
            ESUtils::createRange($create_after, $create_before, "creation_date", $must);

            $modified_before = (isset($options["date_modified_before"]) && $options["date_modified_before"]) ? date('Y-m-d', intval($options["date_modified_before"])) : false;
            $modified_after = (isset($options["date_modified_after"]) && $options["date_modified_before"]) ? date('Y-m-d', intval($options["date_modified_after"])) : false;
            ESUtils::createRange($modified_after, $modified_before, "date_last_modified", $must);


            $creator = isset($options["creator"]) ? $options["creator"] : false;
            ESUtils::createMatchPhrase($creator, "creator", $must);

            $type = isset($options["type"]) ? (is_array($options["type"]) ? $options["type"] : [$type]) : false;
            ESUtils::createShouldMatch($type, "type", 1, $must);

            $options = Array(
                "repository" => "Twake\Drive:DriveFile",
                "index" => "drive_file",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "must" => $must
                    )
                )
            );

            if (isset($options["scroll_id"])) {
                $options["scroll_id"] = $options["scroll_id"];
            }

            $result = $this->doctrine->es_search($options);

            $this->list_files["results"] = [];

            //On traite les données recu d'Elasticsearch
            foreach ($result["result"] as $file) {

                if ($file[0] && ($file[0]->getParentId() == "removed_trashes" || $file[0]->getIsInTrash())) {
                    $this->doctrine->es_remove($file[0], $file[0]->getEsType(), $file[0]->getEsIndex());
                    continue;
                }

                if (!isset($known_workspaces_by_id[$file[0]->getAsArray()["workspace_id"]])) {
                    $workspace_entity = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $file[0]->getAsArray()["workspace_id"]));
                    $known_workspaces_by_id[$file[0]->getAsArray()["workspace_id"]] = $workspace_entity->getAsArray();
                }
                $workspace_array = $known_workspaces_by_id[$file[0]->getAsArray()["workspace_id"]];

                $this->list_files["results"][] = Array(
                    "file" => $file[0]->getAsArray(),
                    "type" => "file",
                    "score" => $file[1][0],
                    "workspace" => $workspace_array
                );

            }

            $scroll_id = $result["scroll_id"];
            $this->list_files["scroll_id"] = $scroll_id;

            $this->list_files["es"] = $options;

            return $this->list_files;
        }
    }

}