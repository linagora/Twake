<?php


namespace AdministrationApi\WorkspacesBundle\Services;


class AdministrationWorkspaces
{

    private $em;

    public function __construct($em) {
        $this->em = $em;
    }

    public function getOneWorkspace($workspace_id) {
        $workspacesRepository = $this->em->getRepository("TwakeWorkspacesBundle:Workspace");

        $workspaces_tab = $workspacesRepository->findBy(array("id" => $workspace_id));

        $rep = false;

        if (count($workspaces_tab) == 1) {
            foreach ($workspaces_tab as $workspace) {
                $rep = $workspace->getAsArray();
            }
        }

        return $rep;
    }

    public function getWorkspaceMembers($workspace_id) {
        $membersRepository = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        $members_tab = $membersRepository->findBy(array("workspace_id" => $workspace_id));

        $members = array();

        foreach ($members_tab as $member) {
            $members[] = $member->getAsArray();
        }

        return $members;
    }

    public function getWorkspaceApps($workspace_id) {
        $appsRepository = $this->em->getrepository("TwakeWorkspacesBundle:WorkspaceApp");

        $apps_tab = $appsRepository->findBy(array("workspace_id" => $workspace_id));

        $apps = array();

        foreach ($apps_tab as $app) {
            $apps[] = $app->getAsArray();
        }

        return $apps;
    }

}