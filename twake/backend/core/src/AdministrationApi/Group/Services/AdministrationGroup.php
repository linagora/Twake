<?php


namespace AdministrationApi\Group\Services;


use App\App;

class AdministrationGroup
{

    private $em;
    private $list_group = Array("group" => Array(), "scroll_id" => "");

    public function __construct(App $app)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
    }

    public function getGroupbyName($options)
    {

        if (isset($options["name"])) {
            $name = $options["name"];

            $options = Array(
                "repository" => "Twake\Workspaces:Group",
                "index" => "group",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "should" => Array(
                            "bool" => Array(
                                "filter" => Array(
                                    "regexp" => Array(
                                        "name" => ".*" . $name . ".*"
                                    )
                                )
                            )
                        )
                    )
                ),
                "sort" => Array(
                    "creation_date" => Array(
                        "order" => "desc"
                    )
                )
            );
        }
        // search in ES
        $result = $this->em->es_search($options);

        //var_dump(json_encode($options,JSON_PRETTY_PRINT));

        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $group) {
            if($group && $group[0]){
                $this->list_group["group"][] = Array($group[0]->getAsArray(), $group[1][0]);
            }
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

    public function getAllUsers()
    {
        $options = Array(
            "repository" => "Twake\Users:User",
            "index" => "users",
            "size" => 10,
            "query" => Array(
                "match_all" => (object)[]
            ),
            "sort" => Array(
                "creation_date" => Array(
                    "order" => "desc"
                )
            )
        );

        // search in ES
        $result = $this->em->es_search($options);

        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $user) {
            //var_dump($file->getAsArray());
            $this->list_group["users"][] = Array($user[0]->getAsArray(), $user[1][0]);;
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

    public function getWpbyName($options)
    {

        if (isset($options["name"])) {
            $name = $options["name"];

            $options = Array(
                "repository" => "Twake\Workspaces:Workspace",
                "index" => "workspace",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "should" => Array(
                            "bool" => Array(
                                "filter" => Array(
                                    "regexp" => Array(
                                        "name" => ".*" . $name . ".*"
                                    )
                                )
                            )
                        )
                    )
                ),
                "sort" => Array(
                    "creation_date" => Array(
                        "order" => "desc"
                    )
                )
            );
        }
        // search in ES
        $result = $this->em->es_search($options);


        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $group) {
            //var_dump($file->getAsArray());
            $this->list_group["group"][] = Array($group[0]->getAsArray(), $group[1][0]);;
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

    public function getAllGroup()
    {

//        $group = new Group("group_admin_test_2");
//        $this->em->persist($group);
//        $this->em->flush();

        $options = Array(
            "repository" => "Twake\Workspaces:Group",
            "index" => "group",
            "size" => 10,
            "query" => Array(
                "match_all" => (object)[]
            ),
            "sort" => Array(
                "creation_date" => Array(
                    "order" => "desc"
                )
            )
        );

        //var_dump(json_encode($options,JSON_PRETTY_PRINT));

        // search in ES
        $result = $this->em->es_search($options);


        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $group) {
            //var_dump($file->getAsArray());
            $this->list_group["group"][] = Array($group[0]->getAsArray(), $group[1][0]);;
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

    public function getAllWorkspace()
    {

//        $group = new Group("group_for_workspace_1");
//        $this->em->persist($group);
//        $this->em->flush();
//
//        $wp = new Workspace("workspace_admin_test_1");
//        $wp->setGroup($group);
//        $this->em->persist($wp);
//        $this->em->flush();

        $options = Array(
            "repository" => "Twake\Workspaces:Workspace",
            "index" => "workspace",
            "size" => 10,
            "query" => Array(
                "match_all" => (object)[]
            ),
            "sort" => Array(
                "creation_date" => Array(
                    "order" => "desc"
                )
            )
        );

        //var_dump(json_encode($options,JSON_PRETTY_PRINT));

        // search in ES
        $result = $this->em->es_search($options);


        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $wp) {
            $this->list_group["group"][] = Array($wp[0]->getAsArray(), $wp[1][0]);;
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

    public function getUserbyMail($options)
    {

        if (isset($options["mail"])) {
            $mail = $options["mail"];

            //var_dump("passage");

            $options = Array(
                "repository" => "Twake\Users:Mail",
                "index" => "mail",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "should" => Array(
                            "bool" => Array(
                                "filter" => Array(
                                    "regexp" => Array(
                                        "mail" => ".*" . $mail . ".*"
                                    )
                                )
                            )
                        )
                    )
                ),
            );
        }

//        $mail = new Mail();
//        $mail->setMail("romaric@twakemail.fr");
//        $this->em->persist($mail);
//        $this->em->flush();

        // search in ES
        $result = $this->em->es_search($options);


        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $mail) {
            //var_dump($file->getAsArray());
            $this->list_group["group"][] = $mail[0]->getUser()
                    ->getId() . "";
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

}
