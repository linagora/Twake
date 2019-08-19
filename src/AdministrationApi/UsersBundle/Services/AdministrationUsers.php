<?php


namespace AdministrationApi\UsersBundle\Services;


class AdministrationUsers
{

    private $em;

    public function __construct($em)
    {
        $this->em = $em;
    }

    public function getAllUsers($limit, $offset)
    {

        $usersRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $usersEnitity = $usersRepository->findBy(Array(), Array(), $limit, $offset/*, "__TOKEN__id"*/);

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
            $workspaces[] = $workspace->getWorkspace()->getAsArray();
        }

        return $workspaces;
    }

    public function getUserMails($user)
    {
        $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");

        $mails_tab = $mailsRepository->findBy(Array("user" => $user));

        $mails = array();

        foreach ($mails_tab as $mail) {
            $mails[] = $mail->getMail();
        }

        return $mails;
    }

    public function getUserGroups($user)
    {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupUser");

        $groups_tab = $groupsRepository->findBy(Array("user" => $user));

        $groups = array();

        foreach ($groups_tab as $group) {
            $groups[] = $group->getGroup()->getAsArray();
        }

        return $groups;
    }

    public function findUserByUsername($username) {

        $usersRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $users = $usersRepository->findBy(Array("usernamecanonical" => $username));

        $rep = false;

        if (count($users) >= 1) {
            $rep = array();

            foreach ($users as $user) {
                $rep[] = $user->getAsArray();
            }
        }

        return $rep;

    }

    public function findUserByEmail($email) {
        $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");

        $usersMails = $mailsRepository->findBy(array("mail" => $email));

        $rep = false;

        if (count($usersMails) >= 1) {
            $rep = array();

            foreach ($usersMails as $mail) {
                $rep[] = $mail->getUser()->getAsArray();
            }
        }

        return $rep;
    }

}
