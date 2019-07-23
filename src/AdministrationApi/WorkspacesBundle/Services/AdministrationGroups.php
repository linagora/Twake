<?php


namespace AdministrationApi\WorkspacesBundle\Services;


class AdministrationGroups
{

    private $em;

    public function __construct($em)
    {
        $this->em = $em;
    }

    public function getAllGroups($limit, $offset) {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:Group");

        $groupsEntity = $groupsRepository->findBy(Array(),Array(),$limit, $offset);

        $groups = Array();

        foreach($groupsEntity as $group) {
            $groups[] = $group->getAsArray();
        }

        return $groups;
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

}