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
        $workspaceAppsRepository = $this->em->getrepository("TwakeWorkspacesBundle:WorkspaceApp");

        $apps_tab = $workspaceAppsRepository->findBy(array("workspace" => $workspace));

        $apps = array();

        $appsRepository = $this->em->getRepository("TwakeMarketBundle:Application");

        foreach ($apps_tab as $appWksp) {
            $app_id = $appWksp->getAppId();

            $app = $appsRepository->find($app_id);

            if ($app) {
                $apps[] = $app->getAsArray();
            }
        }

        return $apps;
    }

}