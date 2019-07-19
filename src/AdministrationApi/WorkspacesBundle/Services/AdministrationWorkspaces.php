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
        $appsRepository = $this->em->getrepository("TwakeWorkspacesBundle:WorkspaceApp");

        $apps_tab = $appsRepository->findBy(array("workspace" => $workspace));

        $apps = array();

        foreach ($apps_tab as $app) {
            $apps[] = $app->getAppId();
        }

        return $apps;
    }

}