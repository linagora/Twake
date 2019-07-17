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

            $user_tab = $usersRepository->findBy(Array('id'=>$user_id));

            $rep = false;

            if (count($user_tab) == 1) {
                foreach ($user_tab as $user) {
                    $rep = $user->getAsArray();
                }
            }
            return $rep;
        } catch (Exception $e) {
            return "Error";
        }
    }

    public function getUserDevices($user_id) {
        $devicesRepository = $this->em->getRepository("TwakeUsersBundle:Device");

        $devices = $devicesRepository->findBy(Array("user_id"=>$user_id));

        return $devices;
    }

    public function getUserWorkspaces($user_id) {
        $workspacesRepository = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        $workspaces = $workspacesRepository->findBy(Array("user_id"=>$user_id));

        return $workspaces;
    }

    public function getUserMails($user_id) {
        $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");

        $mails = $mailsRepository->findBy(Array("user_id"=>$user_id));

        return $mails;
    }

    public function getUserGroups($user_id) {
        $groupsRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupUser");

        $groups = $groupsRepository->findBy(Array("user_id"=>$user_id));

        return $groups;
    }

}