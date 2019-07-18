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

        $devices_tab = $devicesRepository->findBy(Array("user" => $user));

        $devices = array();

        foreach ($devices_tab as $device) {
            $devices[] = $device->getAsArray();
        }

        return $devices;
    }

    public function getUserWorkspaces($user)
    {
        $workspacesRepository = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        $workspaces_tab = $workspacesRepository->findBy(Array("user" => $user));

        $workspaces = array();

        foreach ($workspaces_tab as $workspace) {
            $workspaces[] = $workspace->getAsArray();
        }

        return $workspaces;
    }

    public function getUserMails($user)
    {
        $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");

        $mails_tab = $mailsRepository->findBy(Array("user" => $user));

        $mails = array();

        foreach ($mails_tab as $mail) {
            $mails[] = $mail->getAsArray();
        }

        return $mails;
    }

    public function getUserGroups($user)
    {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupUser");

        $groups_tab = $groupsRepository->findBy(Array("user" => $user));

        $groups = array();

        foreach ($groups_tab as $group) {
            $groups[] = $group->getAsArray();
        }

        return $groups;
    }

}