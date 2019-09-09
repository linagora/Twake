<?php


namespace AdministrationApi\WorkspacesBundle\Services;


class AdministrationGroups
{

    private $em;
    private $list_group = Array("group" => Array(), "scroll_id" => "");

    public function __construct($em)
    {
        $this->em = $em;
    }

    public function getAllGroups() {

        $options = Array(
            "repository" => "TwakeWorkspacesBundle:Group",
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
        foreach ($result["result"] as $group){
            //var_dump($file->getAsArray());
            $group_tab = $group[0]->getAsArray();
            $group_tab["nb_workspaces"] = count($group[0]->getWorkspaces());
            $group_tab["nb_members"] = count($this->getGroupMembers($group[0]));
            $group_tab["creation_data"] = $group[0]->getOnCreationData();
            $this->list_group["group"][]= Array($group_tab,$group[1][0]);
        }
        //var_dump("nombre de resultat : " . count($this->list_files));
        //var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

    public function getOneGroup($group_id) {

        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:Group");

        $group = $groupsRepository->find($group_id);

        return $group;
    }

    public function getGroupWorkspaces($group_id) {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:Group");

        $group = $groupsRepository->find($group_id);

        $rep = false;

        if ($group) {
            $rep = array();

            $workspaces_tab = $group->getWorkspaces();

            foreach ($workspaces_tab as $workspace) {
                $rep[] = $workspace->getAsArray();
            }
        }
        return $rep;
    }

    public function getGroupMembers($group) {
        $membersRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupUser");

        $members_tab = $membersRepository->findBy(Array("group" => $group));

        $members = Array();

        foreach ($members_tab as $member) {
            $members[] = $member->getUser()->getAsArray();
        }

        return $members;
    }

    public function getGroupApps($group) {
        $groupAppRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupApp");

        $apps_tab = $groupAppRepository->findBy(array("group" => $group));

        $apps = array();

        $appsRepository = $this->em->getRepository("TwakeMarketBundle:Application");

        foreach ($apps_tab as $grpApp) {
            $app_id = $grpApp->getAppId();

            $app = $appsRepository->findby(array('id'=> $app_id));

            if (count($app) == 1) {
                $apps[] = $app[0]->getAsArray();
            }

        }

        return $apps;
    }

    public function getGroupbyName($options)
    {

        if (isset($options["name"])) {
            $name = $options["name"];

            $options = Array(
                "repository" => "TwakeWorkspacesBundle:Group",
                "index" => "group",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "should" => Array(
                            "bool" => Array(
                                "filter" => Array(
                                    "regexp" => Array(
                                        "name" => ".*".strtolower($name).".*"
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
        foreach ($result["result"] as $group){
            //var_dump($file->getAsArray());
            $group_tab = $group[0]->getAsArray();
            $group_tab["nb_workspaces"] = count($group[0]->getWorkspaces());
            $group_tab["nb_members"] = count($this->getGroupMembers($group[0]));
            $group_tab["creation_data"] = $group[0]->getOnCreationData();
            $this->list_group["group"][] = Array($group_tab, $group[1][0]);
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

}

