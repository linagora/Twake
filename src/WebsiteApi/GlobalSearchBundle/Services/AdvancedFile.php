<?php


namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;


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


    public function AdvancedFile($current_user_id, $options, $workspaces)
    {
        $this->globalresult = Array();

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

        //on regarde avant l'acces pour ne faire qu'une requete sur ES et pour pouvoir profitier de l'ordonnocement par pertinence
        if (isset($workspace_access) && $workspace_access != Array()) {
            $this->globalresult = $this->fileservice->advancedsearch($options, $workspaces);
        }

        return $this->globalresult;
    }

}