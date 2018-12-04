<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\GroupUser;
use WebsiteApi\WorkspacesBundle\Model\GroupManagersInterface;


class GroupManagers implements GroupManagersInterface
{

    var $doctrine;
    private $twake_mailer;
    private $pusher;

    var $privileges = Array(
        0 => Array("VIEW_USERS"),
        1 => Array( "VIEW_USERS",
            "VIEW_WORKSPACES",
            "VIEW_MANAGERS",
            "VIEW_APPS",
            "VIEW_PRICINGS"),
        2 => Array( "VIEW_USERS",
            "VIEW_WORKSPACES",
            "VIEW_MANAGERS",
            "VIEW_APPS",
            "VIEW_PRICINGS",
            "MANAGE_USERS",
            "MANAGE_WORKSPACES"),
        3 => Array( "VIEW_USERS",
            "VIEW_WORKSPACES",
            "VIEW_MANAGERS",
            "VIEW_APPS",
            "VIEW_PRICINGS",
            "MANAGE_USERS",
            "MANAGE_WORKSPACES",
            "MANAGE_MANAGERS",
            "MANAGE_PRICINGS",
            "MANAGE_APPS",
            "MANAGE_DATA")
    );

    public function __construct($doctrine, $twake_mailer, $pusher)
    {
        $this->doctrine = $doctrine;
        $this->twake_mailer = $twake_mailer;
        $this->pusher = $pusher;
    }

    public function hasPrivileges($level, $privilege){
        $privileges = $this->getPrivileges($level);
        if($privileges == null){
            return false;
        }
        return in_array($privilege, $privileges);
    }

    public function getPrivileges($level){
        if ($level === null) {
            return null;
        }
        return $this->privileges[$level];
    }

    public function getLevel($groupId, $userId, $currentUserId = null)
    {

        if($userId == null){
            return 3; // If userId == null this is the system (all rights)
        }

        /*
         * If currentUserId == null then we are root (system)
         * If we are the current user we can access our data
         * Else we verify that we can look rights
         */

        if($currentUserId == null
            || $currentUserId == $userId
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId, $currentUserId),
                "VIEW_MANAGERS"
            )
        ){

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
            $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("user_group_id" => $user->getId() . "_" . $group->getId()));

            if (!$manager || $manager->getExterne()) {
                return null; //No rights
            }

            return $manager->getLevel();

        }

        return null; //No rights

    }

    public function changeLevel($groupId, $userId, $level, $currentUserId = null)
    {
        $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

        if($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "MANAGE_MANAGERS"
            )
        ) {

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("user" => $user, "group" => $group));

            if($manager){
                $manager->setLevel($level);
                $this->doctrine->persist($manager);
                $this->doctrine->flush();
                return true;
            }

        }

        return false;

    }

    public function addManager($groupId, $userId, $level,$createdWorkspace , $currentUserId = null)
    {
        $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

        if($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "MANAGE_MANAGERS"
            )
        ) {

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("user_group_id" => $user->getId() . "_" . $group->getId()));


            if (!$manager) { // si on a crée un workspace et qu'on s'y ajoute soi même en admin
                if ($createdWorkspace){
                    $manager = new GroupUser($group, $user);
                    $manager->setLevel($level);
                    
                    $this->doctrine->persist($manager);
                    $this->doctrine->flush();

                    return true;
                }else{
                    return false;
                }
            }else{
                $manager->setLevel($level);

                $this->twake_mailer->send($user->getEmail(), "addedToGroupManagersMail", Array("_language" => $user ? $user->getLanguage() : "en", "group" => $group->getDisplayName(), "username" => $user->getUsername()));

                $this->doctrine->persist($manager);
                $this->doctrine->flush();

                return true;
            }

        }

        return false;
    }

    public function removeManager($groupId, $userId, $currentUserId = null)
    {
        $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

        if($currentUserId==$userId){
            return false; //Cant remove myself
        }

        if($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "MANAGE_MANAGERS"
            )
        ) {

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("user_group_id" => $user->getId() . "_" . $group->getId()));

            if(!$manager){
                return true;
            }

            $manager->setLevel(0);
            $this->doctrine->persist($manager);
            $this->doctrine->flush();

            return true;

        }

        return false;
    }

    public function getManagers($groupId, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

        if($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "VIEW_MANAGERS"
            )
        ) {

            $group = $groupRepository->find($groupId);
            $managerLinks = $groupManagerRepository->getManagers($group);

            $users = Array();
            foreach ($managerLinks as $managerLink){
                $users[] = Array(
                    "user" => $managerLink->getUser(),
                    "level" => $managerLink->getLevel()
                );
            }

            return $users;

        }

        return false;
    }

    public function getGroups($userId)
    {

        $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

        $user = $userRepository->find($userId);
        $groupsLinks = $groupManagerRepository->findBy(Array("user" => $user));

        $groups = Array();
        foreach ($groupsLinks as $groupLink){
            $groups[] = Array(
                "group" => $groupLink->getGroup(),
                "level" => $groupLink->getLevel()
            );
        }

        return $groups;
    }

    public function init($group){
        $workspaces = $group->getWorkspaces();
        $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        foreach ( $workspaces as $workspace ){
            $workspace = $workspace["workspace"];
            $members = $workspace->getMembers();

            foreach ($members as $member){
                $userEntity = $member->getUser();
                $manager = $groupManagerRepository->findBy(Array("user_group_id" => $userEntity->getId() . "_" . $group->getId()));

                if ($manager == null){ //si user n'est pas repertorié on l'ajoute au rang super-admin

                    $wss = $workspaceUserRepository->findBy(Array("user" => $userEntity));
                    $nbWs = 0;
                    foreach ($wss as $ws){
                        if($ws->getWorkspace()->getGroup() && $ws->getWorkspace()->getGroup()->getId()==$group->getId()){
                            $nbWs++;
                        }
                    }

                    $newManager = new GroupUser($group,$userEntity);
                    $newManager->setLevel(3);
                    $newManager->setNbWorkspace($nbWs);
                    $this->doctrine->persist($newManager);
                    $this->doctrine->flush();
                }
            }
        }
    }

}