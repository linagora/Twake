<?php


namespace WebsiteApi\GlobalSearchBundle\Services;


class AdvancedTask
{
    private $doctrine;
    private $workspaceservice;
    private $list_tasks = Array("tasks" => Array(), "scroll_id" => "");


    public function __construct($doctrine, $workspaceservice)
    {
        $this->doctrine = $doctrine;
        $this->workspaceservice = $workspaceservice;

    }


    public function AdvancedTask($current_user_id,$options,$workspaces)
    {
        //var_dump("test");
        $workspace_access = Array();
        foreach ($workspaces as $wp){
            $wp_entity = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $wp));
            $members = $wp_entity->getMembers();
            foreach ($members as $member){
                if($member->getUser()->getId()."" === $current_user_id){
                    $workspace_access[] = $wp;
                }
            }
        }


        //on regarde avant l'acces pour ne faire qu'une requete sur ES et pour pouvoir profitier de l'ordonnocement par pertinence
        if(isset($workspace_access) && $workspace_access != Array()){

            $options_save = $options;
            $must = Array();

            //PARTIE SUR LE NAME

            if(isset($options["title"])) {
                $title= Array(
                    "bool" =>Array(
                        "should" => Array(
                            "bool" => Array(
                                "filter" => Array(
                                    "regexp" => Array(
                                        "title" => ".*" . $options["title"] . ".*"
                                    )
                                )
                            )
                        ),
                        "minimum_should_match" => 1
                    )
                );
                $must[] = $title;

            }

            if(isset($options["description"])) {
                $description= Array(
                    "bool" =>Array(
                        "should" => Array(
                            "bool" => Array(
                                "filter" => Array(
                                    "regexp" => Array(
                                        "description" => ".*" . $options["description"] . ".*"
                                    )
                                )
                            )
                        ),
                        "minimum_should_match" => 1
                    )
                );
                $must[] = $description;
            }

            $now = new \DateTime();
            $date_from = $now->format('Y-m-d');
            $date_to = "2000-01-01";
            $modified_before = $now->format('Y-m-d');
            $modified_after = "2000-01-01";

            if(isset($options["date_from"])){
                $date_from = $options["date_from"];
            }

            if(isset($options["date_to"])){
                $date_to = $options["date_to"];
            }

            if(isset($options["date_modified_before"])){
                $modified_before = $options["date_modified_before"];
            }

            if(isset($options["date_modified_after"])){
                $modified_after = $options["date_modified_after"];
            }

            //PARTIES SUR LES WORKSPACES
            $should_workspaces = Array();
            foreach($workspaces as $wp) {
                $should_workspaces[] = Array(
                    "match_phrase" => Array(
                        "workspace_id" => $wp
                    )
                );
            }

            //PARTIES SUR LES TAGS
            if(isset($options["tags"])){
                $should_tags = Array();
                foreach($options["tags"] as $tag) {
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

            //PARTIES SUR LES PARTICIPANTS
            if(isset($options["participants"])){

                $should_participants = Array();
                foreach($options["participants"] as $participant) {
                    $should_participants[] = Array(
                        "nested" => Array(
                            "path" => "participants",
                            "score_mode" => "avg",
                            "query" => Array(
                                "bool" => Array(
                                    "should" => Array(
                                        Array(
                                            "bool" => Array(
                                                "must" => Array(
                                                    "match_phrase" => Array(
                                                        "participants.user_id_or_mail" => $participant
                                                    )
                                                )
                                            )
                                        ),
                                        Array(
                                            "bool" => Array(
                                                "filter" => Array(
                                                    "regexp" => Array(
                                                        "participants.email" => ".*".$participant.".*"
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    "minimum_should_match" => 1
                                )
                            )
                        )
                    );
                }


                $must[] = Array(
                    "bool" => Array(
                        "should" => $should_participants,
                        "minimum_should_match" => count($options["participants"])
                    )
                );
            }



            $must[] = Array(
                "bool" => Array(
                    "should" => $should_workspaces,
                    "minimum_should_match" => 1
                )
            );



            if(isset($options["owner"])){
                $must[] = Array(
                    "match_phrase" => Array(
                        "owner" => $options["owner"]
                    )
                );
            }


            $must[] = Array(
                "range" => Array(
                    "date_from" => Array(
                        "lte" => $date_to,
                        "gte" => $date_from
                    )
                )
            );

            $must[] = Array(
                "range" => Array(
                    "date_to" => Array(
                        "lte" => $date_to,
                        "gte" => $date_from
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
                "repository" => "TwakeTasksBundle:Task",
                "index" => "task",
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

//        var_dump(json_encode($options,JSON_PRETTY_PRINT));

            // search in ES
            $result = $this->doctrine->es_search($options);


            array_slice($result["result"], 0, 5);

            $scroll_id = $result["scroll_id"];

            //on traite les données recu d'Elasticsearch
            //var_dump(json_encode($options));
            foreach ($result["result"] as $task){
                //var_dump($file->getAsArray());
                $this->list_tasks["tasks"][]= $task->getAsArray();
            }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_files);
            $this->list_tasks["scroll_id"] = $scroll_id;

            return $this->list_tasks ?: null;
        }

    }

}