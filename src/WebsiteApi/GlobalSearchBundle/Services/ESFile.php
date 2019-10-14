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

    public function search($current_user_id, $termslist, $workspaces)
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

        foreach ($workspaces as $workspace) {
            $should_workspaces[] = Array(
                "match_phrase" => Array(
                    "workspace_id" => $workspace["id"]
                )
            );
        }

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

}