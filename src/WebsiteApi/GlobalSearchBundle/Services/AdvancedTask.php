<?php


namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;


class AdvancedTask
{
    private $doctrine;
    private $workspaceservice;
    private $list_tasks = Array("results" => Array(), "scroll_id" => "");


    public function __construct($doctrine, $workspaceservice)
    {
        $this->doctrine = $doctrine;
        $this->workspaceservice = $workspaceservice;

    }


    public function AdvancedTask($current_user_id, $options, $workspaces)
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


        //On commence le travail de création de la query
        if (isset($workspace_access) && $workspace_access != Array()) {

            $must = Array();

            ESUtils::createShouldMatch($workspaces, "workspace_id", 1, $must);

            $title = isset($options["title"]) ? preg_filter('/($|^)/', '.*', explode(" ", $options["title"])) : false;
            ESUtils::createRegexShouldMatch($title, "title", "all", $must);

            $description = isset($options["description"]) ? preg_filter('/($|^)/', '.*', explode(" ", $options["description"])) : false;
            ESUtils::createRegexShouldMatch($description, "description", "all", $must);

            $participants = isset($options["participants"]) ? $options["participants"] : false;
            ESUtils::createNestedShouldMatch($participants, "participants.user_id_or_mail", "all", $must);

            $tags = isset($options["tags"]) ? $options["tags"] : false;
            ESUtils::createShouldMatch($tags, "tags", "all", $must);

            $owner = isset($options["owner"]) ? $options["owner"] : false;
            ESUtils::createMatchPhrase($owner, "owner", $must);

            $date_created_after = isset($options["date_created_after"]) ? $options["date_created_after"] : false;
            $date_created_before = isset($options["date_created_before"]) ? $options["date_created_before"] : false;
            ESUtils::createRange($date_created_after, $date_created_before, "date_created", $must);

            $modified_before = isset($options["date_modified_before"]) ? $options["date_modified_before"] : false;
            $modified_after = isset($options["date_modified_after"]) ? $options["date_modified_after"] : false;
            ESUtils::createRange($modified_after, $modified_before, "date_last_modified", $must);

            $before_before = isset($options["before_before"]) ? $options["before_before"] : false;
            $before_after = isset($options["before_after"]) ? $options["before_after"] : false;
            ESUtils::createRange($before_after, $before_before, "before", $must);

            $start_time_before = isset($options["start_time_before"]) ? $options["start_time_before"] : false;
            $start_time_after = isset($options["start_time_after"]) ? $options["start_time_after"] : false;
            ESUtils::createRange($start_time_after, $start_time_before, "start", $must);

            $options = Array(
                "repository" => "TwakeTasksBundle:Task",
                "index" => "task",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "must" => $must
                    )
                ),
                "sort" => Array(
                    "before" => Array(
                        "order" => "desc",
                    )
                )
            );

            $result = $this->doctrine->es_search($options);

            //On traite les données recu d'Elasticsearch
            foreach ($result["result"] as $task) {
                $this->list_tasks["results"][] = Array(
                    "task" => $task[0]->getAsArray(),
                    "type" => "task",
                    "score" => $task[1][0],
                    "workspace" => false, //TODO
                    "board" => false, //TODO
                    "list" => false //TODO
                );
            }

            $scroll_id = $result["scroll_id"];
            $this->list_tasks["scroll_id"] = $scroll_id;

            $this->list_tasks["es"] = $options;

            return $this->list_tasks;
        }

    }

}