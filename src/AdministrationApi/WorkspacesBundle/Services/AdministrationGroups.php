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

        $groups = $groupsRepository->findBy(Array(),Array(),$limit, $offset);

        return $groups;
    }

    public function getOneGroup($group_id) {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:Group");

        $group = $groupsRepository->find($group_id);

        if ($group) {
            return $group->getAsArray();
        }
        return false;
    }

    public function getGroupWorkspaces($group_id) {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:Group");

        $group = $groupsRepository->find($group_id);

        if ($group) {
            return $group->getWorkspaces();
        }
        return false;
    }

    public function getGroupMembers($group_id) {

    }

}