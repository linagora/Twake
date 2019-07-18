<?php


namespace AdministrationApi\UsersBundle\Services;


class AdministrationUsers
{

    private $em;

    public function __construct($em)
    {
        $this->em = $em;
    }

    public function getAllUsers($limit, $page) {

        $offset = 0;

        $usersRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $usersEnitity = $usersRepository->findBy(Array(),Array(),$limit,$offset);

        $users = Array();

        foreach ($usersEnitity as $user) {
            $users[] = $user->getAsArray();
        }

        return $users;
    }

    public function getOneUser($user_id) {
        try {
            $usersRepository = $this->em->getRepository("TwakeUsersBundle:User");

            $user = $usersRepository->find($user_id);

            return $user;

        } catch (Exception $e) {
            return "Error";
        }
    }

    public function getUserDevices($user)
    {
        $devicesRepository = $this->em->getRepository("TwakeUsersBundle:Device");

        $devices = $devicesRepository->findBy(Array("user" => $user));

        return $devices;
    }

    public function getUserWorkspaces($user)
    {
        $workspacesRepository = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        $workspaces = $workspacesRepository->findBy(Array("user" => $user));

        return $workspaces;
    }

    public function getUserMails($user)
    {
        $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");

        $mails = $mailsRepository->findBy(Array("user" => $user));

        return $mails;
    }

    public function getUserGroups($user)
    {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupUser");

        $groups = $groupsRepository->findBy(Array("user" => $user));

        return $groups;
    }

}