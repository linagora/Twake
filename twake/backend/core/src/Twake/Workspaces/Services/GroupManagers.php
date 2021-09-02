<?php

namespace Twake\Workspaces\Services;

use App\App;
use Twake\Workspaces\Entity\GroupUser;
use Twake\Workspaces\Model\GroupManagersInterface;


class GroupManagers
{

    var $doctrine;
    var $privileges = Array(
        0 => Array("VIEW_USERS"),
        1 => Array("VIEW_USERS",
            "VIEW_WORKSPACES",
            "VIEW_MANAGERS",
            "VIEW_APPS",
            "VIEW_PRICINGS"),
        2 => Array("VIEW_USERS",
            "VIEW_WORKSPACES",
            "VIEW_MANAGERS",
            "VIEW_APPS",
            "VIEW_PRICINGS",
            "MANAGE_USERS",
            "MANAGE_WORKSPACES"),
        3 => Array("VIEW_USERS",
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
    private $twake_mailer;
    private $pusher;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->twake_mailer = $app->getServices()->get("app.twake_mailer");
        $this->pusher = $app->getServices()->get("app.pusher");
    }

    public function changeLevel($groupId, $userId, $level, $currentUserId = null)
    {
        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

        if ($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "MANAGE_MANAGERS"
            )
        ) {

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("user" => $user, "group" => $group));

            if ($manager) {
                $manager->setLevel($level);
                $this->doctrine->persist($manager);
                $this->doctrine->flush();
                return true;
            }

        }

        return false;

    }

    public function hasPrivileges($level, $privilege)
    {
        $privileges = $this->getPrivileges($level);
        if ($privileges == null) {
            return false;
        }
        return in_array($privilege, $privileges);
    }

    public function getPrivileges($level)
    {
        if ($level === null) {
            return null;
        }
        return $this->privileges[$level];
    }

    public function getLevel($groupId, $userId, $currentUserId = null)
    {

        if ($userId == null) {
            return 3; // If userId == null this is the system (all rights)
        }

        /*
         * If currentUserId == null then we are root (system)
         * If we are the current user we can access our data
         * Else we verify that we can look rights
         */

        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

        $user = $userRepository->find($userId);
        $group = $groupRepository->find($groupId);
        $manager = $groupManagerRepository->findOneBy(Array("user" => $user, "group" => $group));

        if (!$manager || $manager->getExterne()) {
            return null; //No rights
        }

        return $manager->getLevel();


    }

    public function toggleManager($groupId, $userId, $isManager = null, $currentUserId = null)
    {
        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

        if ($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "MANAGE_MANAGERS"
            )
        ) {

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("group" => $groupId, "user" => $userId));
            if (!$manager) { // not in group
                return false;
            }
            if ($manager->getLevel() != null && $manager->getLevel() == 3 && $isManager != null && $isManager == true) {
                // is already manager;
                return true;
            }
            if ($manager->getLevel() == null && $isManager != null && $isManager == false) {
                // is already not manager;
                return true;
            }
            if ($manager->getLevel() == null) { // si l'utilisateur n'est pas manager
                $manager->setLevel(3);

                $this->doctrine->persist($manager);
                $this->doctrine->flush();

            } else {
                $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
                $otherPotentialGroupAdmin = $groupUserRepository->findBy(Array("group" => $groupId));
                $hasOtherAdmin = false;
                foreach ($otherPotentialGroupAdmin as $potentialAdmin) {
                    if ($potentialAdmin->getLevel() == 3 && $potentialAdmin->getUser()->getId() != $userId) {
                        $hasOtherAdmin = true;
                    }
                }
                if (!$hasOtherAdmin) {
                    header("twake-debug: no other group admins");
                    return false;
                }
                $manager->setLevel(null);
                $this->doctrine->persist($manager);
                $this->doctrine->flush();
            }
            $dataToPush = Array(
                "type" => "update_group_privileges",
                "group_id" => $groupId,
                "privileges" => $this->getPrivileges($this->getLevel($groupId, $userId))
            );
            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);

            return true;

        }
        return false;
    }

    public function addManager($groupId, $userId, $level, $createdWorkspace, $currentUserId = null)
    {
        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

        if ($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "MANAGE_MANAGERS"
            )
        ) {

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("user" => $user, "group" => $group));


            if (!$manager) { // si on a crée un workspace et qu'on s'y ajoute soi même en admin
                if ($createdWorkspace) {
                    $manager = new GroupUser($group, $user);
                    $manager->setLevel($level);

                    $this->doctrine->persist($manager);
                    $this->doctrine->flush();

                    return true;
                } else {
                    return false;
                }
            } else {
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
        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

        if ($currentUserId == $userId) {
            return false; //Cant remove myself
        }

        if ($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "MANAGE_MANAGERS"
            )
        ) {

            $user = $userRepository->find($userId);
            $group = $groupRepository->find($groupId);
            $manager = $groupManagerRepository->findOneBy(Array("user" => $user, "group" => $group));

            if (!$manager) {
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
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

        if ($currentUserId == null
            || $this->hasPrivileges(
                $this->getLevel($groupId, $currentUserId),
                "VIEW_MANAGERS"
            )
        ) {

            $group = $groupRepository->find($groupId);
            $managerLinks = $groupManagerRepository->findBy(Array("group" => $group, "level" => 0));

            $users = Array();
            foreach ($managerLinks as $managerLink) {
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

        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

        $user = $userRepository->find($userId);
        $groupsLinks = $groupManagerRepository->findBy(Array("user" => $user));

        $groups = Array();
        foreach ($groupsLinks as $groupLink) {
            $groups[] = Array(
                "group" => $groupLink->getGroup(),
                "level" => $groupLink->getLevel()
            );
        }

        return $groups;
    }

    public function init($group)
    {
        $workspaces = $group->getWorkspaces();
        $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
        $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");

        foreach ($workspaces as $workspace) {
            $workspace = $workspace["workspace"];
            $members = $workspace->getMembers();

            foreach ($members as $member) {
                $userEntity = $member->getUser($this->doctrine);
                $manager = $groupManagerRepository->findBy(Array("user" => $userEntity, "group" => $group));

                if ($manager == null) { //si user n'est pas repertorié on l'ajoute au rang super-admin

                    $wss = $workspaceUserRepository->findBy(Array("user_id" => $userEntity->getId()));
                    $nbWs = 0;
                    foreach ($wss as $ws) {
                        if ($ws->getWorkspace($this->doctrine)->getGroup() && $ws->getWorkspace($this->doctrine)->getGroup() == $group->getId()) {
                            $nbWs++;
                        }
                    }

                    $newManager = new GroupUser($group, $userEntity);
                    $newManager->setLevel(3);
                    $newManager->setNbWorkspace($nbWs);
                    $this->doctrine->persist($newManager);
                    $this->doctrine->flush();
                }
            }
        }
    }

}