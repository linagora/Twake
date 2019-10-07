<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class ESFile
{
    private $doctrine;
    private $list_files = Array("files" => Array(), "scroll_id" => "");

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function search($termslist, $workspaces)
    {

        $terms = Array();
        $should_workspaces = Array();


        foreach ($termslist as $term) {
            $st = new StringCleaner();
            $term = $st->simplifyInArray($term);
            $terms[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "keywords.keyword" => ".*" . $term . ".*"
                        )
                    )
                )
            );
        }

        foreach ($workspaces as $workspace) {
            $should_workspaces[] = Array(
                "match_phrase" => Array(
                    "workspace_id" => $workspace["id"]
                )
            );
        }


        $nested = Array(
            "nested" => Array(
                "path" => "keywords",
                "score_mode" => "avg",
                "query" => Array(
                    "bool" => Array(
                        "should" => $terms
                    )
                )
            )
        );

        $options = Array(
            "repository" => "TwakeDriveBundle:DriveFile",
            "index" => "drive_file",
            "query" => Array(
                "bool" => Array(
                    "must" => Array(
                        "bool" => Array(
                            "should" => Array(
                                $should_workspaces
                            ),
                            "minimum_should_match" => 1,
                            "must" => Array(
                                "bool" => Array(
                                    "should" => Array(
                                        $nested
                                    ),
                                    "minimum_should_match" => 1
                                )
                            )
                        )
                    )
                )
            ),
            "sort" => Array(
                "keywords.score" => Array(
                    "mode" => "sum",
                    "order" => "desc",
                    "nested" => Array(
                        "path" => "keywords",
                        "filter" => Array(
                            "bool" => Array(
                                "should" => $terms
                            )
                        )
                    )
                )
            )
        );

        $files = $this->doctrine->es_search($options);
        $files_final = Array();
        foreach ($files["result"] as $file) {
            $files_final[] = Array($file[0]->getAsArray(), $file[1][0]);
        }
        return $files_final;
    }

    public function advancedsearch($options, $workspaces)
    {

        $options_save = $options;
        $must = Array();

        //PARTIE SUR LE NAME

        if (isset($options["name"])) {

            $terms = [];
            $st = new StringCleaner();
            foreach (explode(" ", $options["name"]) as $term) {
                $term = $st->simplifyInArray($term);
                $terms[] = Array(
                    "bool" => Array(
                        "filter" => Array(
                            "regexp" => Array(
                                "keywords.keyword" => ".*" . $term . ".*"
                            )
                        )
                    )
                );
            }

            $nested = Array(
                "nested" => Array(
                    "path" => "keywords",
                    "score_mode" => "avg",
                    "query" => Array(
                        "bool" => Array(
                            "should" => $terms
                        )
                    )
                )
            );

            $name = Array(
                "bool" => Array(
                    "should" => Array(
                        $nested
                    ),
                    "minimum_should_match" => 1
                )
            );
        }

        $now = new \DateTime();
        $create_before = $now->format('Y-m-d');
        $create_after = "2000-01-01";
        $modified_before = $now->format('Y-m-d');
        $modified_after = "2000-01-01";
        $size_gte = 0;
        $size_lte = 2000000000;

        if (isset($options["size_lte"])) {
            $size_lte = $options["size_lte"];
        }

        if (isset($options["size_gte"])) {
            $size_gte = $options["size_gte"];
        }

        if (isset($options["date_create_before"])) {
            $create_before = $options["date_create_before"];
        }

        if (isset($options["date_create_after"])) {
            $create_after = $options["date_create_after"];
        }

        if (isset($options["date_modified_before"])) {
            $modified_before = $options["date_modified_before"];
        }

        if (isset($options["date_modified_after"])) {
            $modified_after = $options["date_modified_after"];
        }

        //PARTIES SUR LES WORKSPACES
        $should_workspaces = Array();
        foreach ($workspaces as $wp) {
            if (!is_string($wp)) {
                if (is_array($wp)) {
                    $wp = $wp["id"];
                } else {
                    $wp = $wp->getId();
                }
            }
            $should_workspaces[] = Array(
                "match_phrase" => Array(
                    "workspace_id" => $wp
                )
            );
        }

        //PARTIES SUR LES TAGS
        if (isset($options["tags"])) {
            $should_tags = Array();
            foreach ($options["tags"] as $tag) {
                $should_tags[] = Array(
                    "match_phrase" => Array(
                        "tags" => $tag
                    )
                );
            }

            $must[] = Array(
                "bool" => Array(
                    "should" => $should_tags,
                    "minimum_should_match" => count($should_tags)
                )
            );
        }


        $must[] = Array(
            "bool" => Array(
                "should" => $should_workspaces,
                "minimum_should_match" => 1
            )
        );


        if (isset($options["creator"])) {
            $must[] = Array(
                "match_phrase" => Array(
                    "creator" => $options["creator"]
                )
            );
        }


        if (isset($options["type"])) {
            $must[] = Array(
                "match_phrase" => Array(
                    "type" => strtolower($options["type"])
                )
            );
        }

        if (isset($name)) {
            $must[] = $name;
        }

        $must[] = Array(
            "range" => Array(
                "size" => Array(
                    "lte" => $size_lte,
                    "gte" => $size_gte
                )
            )

        );

        $must[] = Array(
            "range" => Array(
                "creation_date" => Array(
                    "lte" => $create_before,
                    "gte" => $create_after
                )
            )
        );

        $must[] = Array(
            "range" => Array(
                "date_last_modified" => Array(
                    "lte" => $modified_before,
                    "gte" => $modified_after
                )
            )
        );

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

        // search in ES
        $result = $this->doctrine->es_search($options);
        $this->list_files["es"] = $options;

        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        foreach ($result["result"] as $file) {
            $this->list_files["results"][] = $file[0]->getAsArray();
        }
        $this->list_files["scroll_id"] = $scroll_id;

        return $this->list_files;

    }

}