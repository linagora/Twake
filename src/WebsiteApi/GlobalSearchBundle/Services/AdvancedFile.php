<?php


namespace WebsiteApi\GlobalSearchBundle\Services;


class AdvancedFile
{
    private $doctrine;
    private $fileservice;
    private $workspaceservice;
    private $globalresult;

    public function __construct($doctrine, $fileservice, $workspaceservice)
    {
        $this->doctrine = $doctrine;
        $this->fileservice = $fileservice;
        $this->workspaceservice = $workspaceservice;

    }


    public function AdvancedFile($current_user_id,$options,$workspaces)
    {
        $this->globalresult = Array();

        $workspace_access = Array();
        foreach ($workspaces as $wp){
            //$member = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace_id" => $wp, "user_id"=> $current_user_id));
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
            //do search
        }

        return $this->globalresult;
    }

}