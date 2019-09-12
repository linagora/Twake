<?php


namespace AdministrationApi\WorkspacesBundle\Services;


class AdministrationWorkspaces
{

    private $em;
    private $list_workspace = Array("workspace" => Array(), "scroll_id" => "");

    public function __construct($em) {
        $this->em = $em;
    }

    public function getOneWorkspace($workspace_id) {
        $workspacesRepository = $this->em->getRepository("TwakeWorkspacesBundle:Workspace");

        $workspace = $workspacesRepository->find($workspace_id);

        return $workspace;
    }

    public function getWorkspaceMembers($workspace) {
        $membersRepository = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        $members_tab = $membersRepository->findBy(array("workspace" => $workspace));

        $members = array();

        foreach ($members_tab as $member) {
            $members[] = $member->getUser()->getAsArray();
        }

        return $members;
    }

    public function getWorkspaceApps($workspace) {
        $workspaceAppsRepository = $this->em->getrepository("TwakeWorkspacesBundle:WorkspaceApp");

        $apps_tab = $workspaceAppsRepository->findBy(array("workspace" => $workspace));

        $apps = array();

        $appsRepository = $this->em->getRepository("TwakeMarketBundle:Application");

        foreach ($apps_tab as $appWksp) {
            $app_id = $appWksp->getAppId();

            $app = $appsRepository->findBy(array('id' => $app_id));

            if (count($app) == 1) {
                $apps[] = $app[0]->getAsArray();
            }
        }

        return $apps;
    }

    public function getInvitedUsers($workspace) {
        $workspaceMailRepository = $this->em->getrepository("TwakeWorkspacesBundle:WorkspaceUserByMail");

        $mails_tab = $workspaceMailRepository->findBy(array('workspace' => $workspace));

        $mails = array();

        foreach ($mails_tab as $ws_mail) {
            $mails[] = $ws_mail->getMail();
        }

        return $mails;
    }

    public function getWpbyName($options){

        if (isset($options["name"])) {
            $name = $options["name"];

            $options = Array(
                "repository" => "TwakeWorkspacesBundle:Workspace",
                "index" => "workspace",
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


        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $workspace){
            //var_dump($file->getAsArray());
            $this->list_workspace["workspace"][]= Array($workspace[0]->getAsArray(),$workspace[1][0]);;
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_workspace["scroll_id"] = $scroll_id;

        return $this->list_workspace ?: null;
    }

    public function getAllWorkspace($options)
    {

//        $group = new Group("group_for_workspace_1");
//        $this->em->persist($group);
//        $this->em->flush();
//
//        $wp = new Workspace("workspace_admin_test_1");
//        $wp->setGroup($group);
//        $this->em->persist($wp);
//        $this->em->flush();
        if(isset($options) && $options != Array()) {
            $options = Array(
                "repository" => "TwakeWorkspacesBundle:Workspace",
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
        }

        //var_dump(json_encode($options,JSON_PRETTY_PRINT));

        // search in ES
        $result = $this->em->es_search($options);


        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $wp){
            $this->list_group["group"][]= Array($wp[0]->getAsArray(),$wp[1][0]);;
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_group);
        $this->list_group["scroll_id"] = $scroll_id;

        return $this->list_group ?: null;
    }

}