<?php


namespace Twake\GlobalSearch\Services;

use App\App;

class AdvancedEvent
{
    private $doctrine;
    private $workspaceservice;
    private $list_events = Array("results" => Array(), "scroll_id" => "");


    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->workspaceservice = $app->getServices()->get("app.workspaces");

    }


    public function AdvancedEvent($current_user_id, $options, $workspaces)
    {
        $known_workspaces_by_id = Array();

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

        //on regarde avant l'acces pour ne faire qu'une requete sur ES et pour pouvoir profitier de l'ordonnocement par pertinence
        if (isset($workspace_access) && $workspace_access != Array()) {

            $must = Array();

            $visible_match = ESUtils::createShouldMatch($workspaces, "workspace_id", 1);
            $visible_match["bool"]["should"][] = Array(
                "match_phrase" => Array(
                    "participants" => $current_user_id
                )
            );
            $must[] = $visible_match;

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


            $date_from = isset($options["date_from"]) ? $options["date_from"] : false;
            $date_to = isset($options["date_to"]) ? $options["date_to"] : false;
            ESUtils::createRange($date_from, $date_to, "date_from", $must);

            $modified_before = isset($options["date_modified_before"]) ? $options["date_modified_before"] : false;
            $modified_after = isset($options["date_modified_after"]) ? $options["date_modified_after"] : false;
            ESUtils::createRange($modified_after, $modified_before, "date_last_modified", $must);

            $options = Array(
                "repository" => "Twake\Calendar:Event",
                "index" => "event",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "must" => $must
                    )
                ),
                "sort" => Array(
                    "date_from" => Array(
                        "order" => "desc",
                    )
                )
            );

            if (isset($options["scroll_id"])) {
                $options["scroll_id"] = $options["scroll_id"];
            }

            $result = $this->doctrine->es_search($options);

            //On traite les données recu d'Elasticsearch
            foreach ($result["result"] as $event) {

                $workspaces_calendars = $event[0]->getWorkspacesCalendars();
                $workspace_id = null;
                if ($workspaces_calendars) {
                    foreach ($workspaces_calendars as $workspace_calendar) {
                        $workspace_id = $workspace_calendar["workspace_id"];
                        break;
                    }
                }

                if ($workspace_id) {
                    if (!isset($known_workspaces_by_id[$workspace_id])) {
                        $workspace_entity = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspace_id));
                        $known_workspaces_by_id[$workspace_id] = $workspace_entity->getAsArray();
                    }
                    $workspace_array = $known_workspaces_by_id[$workspace_id];
                }

                $this->list_events["results"][] = Array(
                    "event" => $event[0]->getAsArray(),
                    "type" => "event",
                    "score" => $event[1][0],
                    "workspace" => $workspace_array
                );
            }

            $scroll_id = $result["scroll_id"];
            $this->list_events["scroll_id"] = $scroll_id;

            $this->list_events["es"] = $options;

            return $this->list_events;
        }

    }

}