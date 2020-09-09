<?php


namespace Twake\GlobalSearch\Services;

use App\App;

class AdvancedTask
{
    private $doctrine;
    private $workspaceservice;
    private $list_tasks = Array("results" => Array(), "scroll_id" => "");


    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->workspaceservice = $app->getServices()->get("app.workspaces");

    }


    public function AdvancedTask($current_user_id, $options, $workspaces)
    {
        $known_workspaces_by_id = Array();
        $known_boards_by_id = Array();
        $known_lists_by_id = Array();

        //Prepare parameters
        if (!$options["title"]) {
            $options["title"] = $options["name"];
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


        //On commence le travail de création de la query
        if (isset($workspace_access) && $workspace_access != Array()) {

            $must = Array();

            ESUtils::createShouldMatch($workspaces, "workspace_id", 1, $must);

            $title = isset($options["title"]) ? preg_filter('/($|^)/', '.*', explode(" ", $options["title"])) : false;
            ESUtils::createRegexShouldMatch($title, "title", "all", $must);

            $description = isset($options["description"]) ? preg_filter('/($|^)/', '.*', explode(" ", $options["description"])) : false;
            ESUtils::createRegexShouldMatch($description, "description", "all", $must);

            $participants = isset($options["participants"]) ? $options["participants"] : false;
            ESUtils::createShouldMatch($participants, "participants", "all", $must);

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
                "repository" => "Twake\Tasks:Task",
                "index" => "task",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "must" => $must
                    )
                ),
                "sort" => Array(
                    "date_last_modified" => Array(
                        "order" => "desc",
                    )
                )
            );

            if (isset($options["scroll_id"])) {
                $options["scroll_id"] = $options["scroll_id"];
            }

            $result = $this->doctrine->es_search($options);

            //On traite les données recu d'Elasticsearch
            foreach ($result["result"] as $task) {

                $list_id = $task[0]->getAsArray()["list_id"];
                $board_id = $task[0]->getAsArray()["board_id"];
                $workspace_id = $task[0]->getAsArray()["workspace_id"];

                if (!isset($known_workspaces_by_id[$workspace_id])) {
                    $workspace_entity = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspace_id));
                    $known_workspaces_by_id[$workspace_id] = $workspace_entity->getAsArray();
                }
                $workspace_array = $known_workspaces_by_id[$workspace_id];

                if (!isset($known_lists_by_id[$list_id])) {
                    $list_entity = $this->doctrine->getRepository("Twake\Tasks:BoardList")->findOneBy(Array("id" => $list_id));
                    $known_lists_by_id[$list_id] = $list_entity->getAsArray();
                }
                $list_array = $known_lists_by_id[$list_id];

                if (!isset($known_boards_by_id[$board_id])) {
                    $board_entity = $this->doctrine->getRepository("Twake\Tasks:Board")->findOneBy(Array("id" => $board_id));
                    $known_boards_by_id[$board_id] = $board_entity->getAsArray();
                }
                $board_array = $known_boards_by_id[$board_id];

                $this->list_tasks["results"][] = Array(
                    "task" => $task[0]->getAsArray(),
                    "type" => "task",
                    "score" => $task[1][0],
                    "workspace" => $workspace_array,
                    "board" => $board_array,
                    "list" => $list_array
                );
            }

            $scroll_id = $result["scroll_id"];
            $this->list_tasks["scroll_id"] = $scroll_id;

            $this->list_tasks["es"] = $options;

            return $this->list_tasks;
        }

    }

}