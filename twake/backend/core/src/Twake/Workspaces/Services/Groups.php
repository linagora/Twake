<?php

namespace Twake\Workspaces\Services;

use Twake\Workspaces\Entity\Group;
use Twake\Workspaces\Entity\GroupApp;
use Twake\Workspaces\Entity\GroupManager;
use Twake\Workspaces\Model\GroupsInterface;
use App\App;

class Groups
{

    private $doctrine;
    private $gms;
    private $market;
    private $string_cleaner;
    private $wms;
    private $pusher;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->gms = $app->getServices()->get("app.group_managers");
        $this->market = $app->getServices()->get("app.applications");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
        $this->wms = $app->getServices()->get("app.workspace_members");
        $this->pusher = $app->getServices()->get("app.pusher");
    }

    public function create($userId, $name, $uniquename, $planId, $group_data_on_create = Array())
    {
        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");

        $user = $userRepository->find($userId);

        //Find a name
        $groupUsingThisName = $groupRepository->findOneBy(Array("name" => $uniquename));
        $increment = 0;
        $uniquenameIncremented = $uniquename;
        while ($groupUsingThisName != null) {
            $groupUsingThisName = $groupRepository->findOneBy(Array("name" => $uniquenameIncremented));
            $increment += 1;
            if ($groupUsingThisName != null) {
                $uniquenameIncremented = $uniquename . "-" . $increment;
            }
        }


        $group = new Group($uniquenameIncremented);
        $group->setDisplayName($name);
        $group->setOnCreationData($group_data_on_create);

        $this->doctrine->persist($group);
        $this->doctrine->flush();

        $this->gms->addManager($group->getId(), $userId, 3, true);

        $this->init($group);

        return $group;

    }

    public function init($group)
    {
        $appRepository = $this->doctrine->getRepository("Twake\Market:Application");
        $groupAppRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");

        $groupApps = $groupAppRepository->findBy(Array("group" => $group));

        $listApps = $appRepository->findBy(Array("is_default" => true));

        if (count($groupApps) != 0) {
            return false;
        } else {
            foreach ($listApps as $app) {
                $groupapp = new GroupApp($group, $app->getId());
                $groupapp->setWorkspaceDefault(true);
                $this->doctrine->persist($groupapp);
            }
            $this->doctrine->flush();
            return true;
        }
        return true;
    }

    public function changeData($groupId, $name, $currentUserId = null)
    {
        if ($currentUserId != null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_DATA")) {

            $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
            $group = $groupRepository->find($groupId);

            $group->setDisplayName($name);

            //Find a name
            $groupUsingThisName = $groupRepository->findOneBy(Array("name" => $name));
            $increment = 0;
            $uniquenameIncremented = $this->string_cleaner->simplify($name);

            while ($groupUsingThisName != null) {
                $groupUsingThisName = $groupRepository->findOneBy(Array("name" => $uniquenameIncremented));
                $increment += 1;
                if ($groupUsingThisName != null) {
                    $uniquenameIncremented = $name . "-" . $increment;
                }
            }

            $group->setName($uniquenameIncremented);

            $this->doctrine->persist($group);
            $this->doctrine->flush();

            return true;
        } else {
            error_log("NOT ALLOWED");
        }

        return false;
    }

    public function removeUserFromGroup($groupId, $userId, $currentUserId = null)
    {
        if ($currentUserId == null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_USERS")) {

            $ws = $this->getWorkspaces($groupId);

            foreach ($ws as $workspace) {
                $this->wms->removeMember($workspace->getId(), $userId, $currentUserId);
            }

            return true;
        }

        return false;
    }

    public function getWorkspaces($groupId, $currentUserId = null)
    {
        if ($currentUserId != null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "VIEW_WORKSPACES")) {

            $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
            $group = $groupRepository->findBy(Array("id" => $groupId));

            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");

            return $workspaceRepository->findBy(Array("group" => $group));
        }

        return false;
    }

    public function getUsers($groupId, $currentUserId = null)
    {
        if ($currentUserId == null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "VIEW_WORKSPACES")) {

            $ws = $this->getWorkspaces($groupId);//TODO remove users from all workspaces

            $workspace_ids = Array();
            foreach ($ws as $workspace) {
                $workspace = $workspace["workspace"];
                $workspace_ids[] = $workspace->getId();
            }

            $userLinks = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->getUsersFromGroup($workspace_ids);

            $users = Array();
            foreach ($userLinks as $userLink) {
                $users[] = $userLink->getUser();
            }

            return $users;
        }

        return false;
    }

    public function changeLogo($groupId, $logo, $currentUserId = null, $uploader = null)
    {
        if ($currentUserId != null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_DATA")) {

            $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
            $group = $groupRepository->find($groupId);

            $group->setLogo($logo);

            $this->doctrine->persist($group);
            $this->doctrine->flush();

            return $group;
        }

        return false;
    }

    public function remove($group)
    {

        //TODO REMOVE USERS FROM WORKSPACE
        if ($group != null) {
            $groupappsRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));

            $workspaceRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:Workspace");
            $workspace = $workspaceRepository->findOneBy(Array("name" => "phpunit"));

            $workspaceUserRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:WorkspaceUser");
            $workspaceUsers = $workspaceUserRepository->findBy(Array("workspace_id" => $workspace->getId()));

            $workspaceappsRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:WorkspaceApp");
            $workspaceapps = $workspaceappsRepository->findBy(Array("workspace_id" => $workspace));

            $workspacelevelRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:WorkspaceLevel");
            $workspacelevels = $workspacelevelRepository->findBy(Array("workspace_id" => $workspace));

            $workspacestatsRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:WorkspaceStats");
            $workspacestats = $workspacestatsRepository->findOneBy(Array("workspace" => $workspace));

            $streamRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Discussion:Stream");
            $streams = $streamRepository->findBy(Array("workspace" => $workspace));

            $groupUserdRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:GroupUser");
            $groupUsers = $groupUserdRepository->findBy(Array("group" => $group));

            $groupPricingRepository = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:GroupPricingInstance");
            $groupPricing = $groupPricingRepository->findOneBy(Array("group" => $group));
        }

        //TODO DOCTRINE REMOVE USERS FROM WORKSPACE

        if ($group != null) {
            if ($groupapps != null) {
                if (is_array($groupapps)) {
                    foreach ($groupapps as $groupapp) {
                        $this->get("app.twake_doctrine")->remove($groupapp);
                    }
                }
            }
            if ($workspaceapps != null) {
                if (is_array($workspaceapps)) {
                    foreach ($workspaceapps as $workspaceapp) {
                        $this->get("app.twake_doctrine")->remove($workspaceapp);
                    }
                }
            }
            if ($workspaceUsers != null) {
                if (is_array($workspaceUsers)) {
                    foreach ($workspaceUsers as $workspaceUser) {
                        $this->get("app.twake_doctrine")->remove($workspaceUser);
                    }
                }
            }
            if ($groupPricing != null) {
                $this->get("app.twake_doctrine")->remove($groupPricing);
            }
            if ($workspacelevels != null) {
                if (is_array($workspacelevels)) {
                    foreach ($workspacelevels as $workspacelevel) {
                        $this->get("app.twake_doctrine")->remove($workspacelevel);
                    }
                }
            }
            if ($streams != null) {
                if (is_array($streams)) {
                    foreach ($streams as $stream) {
                        $this->get("app.twake_doctrine")->remove($stream);
                    }
                }
            }
            if ($workspacestats != null) {
                $this->get("app.twake_doctrine")->remove($workspacestats);
            }
            if ($workspace != null) {
                $this->get("app.twake_doctrine")->remove($workspace);
            }
            if (is_array($groupUsers)) {
                foreach ($groupUsers as $groupuser) {
                    $this->get("app.twake_doctrine")->remove($groupuser);
                }
            }
            if ($groupPeriod != null) {
                $this->get("app.twake_doctrine")->remove($groupPeriod);
            }
        }

        if ($group != null) {
            $this->get("app.twake_doctrine")->remove($group);
        }

        $this->get("app.twake_doctrine")->flush();
    }

    public function countUsersGroup($groupId)
    {
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $group = $groupRepository->find($groupId);
        return $group->getMemberCount();
    }

    public function getUsersGroup($groupId, $onlyExterne, $limit = 100, $offset = 0, $currentUserId = null)
    {
        if ($currentUserId == null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "VIEW_USERS")) {

            $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
            $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

            $group = $groupRepository->find($groupId);
            $groupLinks = $groupManagerRepository->findBy(Array("group" => $group), null, $max, $offset);
            $users = Array();
            foreach ($groupLinks as $link) {
                if (!$onlyExterne || $link->getExterne()) {
                    $users[] = Array(
                        "user" => $link->getUser(),
                        "externe" => $link->getExterne(),
                        "level" => $link->getLevel(),
                        "nbWorkspace" => $link->getNbWorkspace()
                    );
                }
            }
            return $users;
        }
        return false;


    }

    public function editUserFromGroup($groupId, $userId, $externe, $currentUserId = null)
    {
        if ($currentUserId == null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_USERS")) {

            $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
            $groupManagerRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

            $group = $groupRepository->find($groupId);
            $user = $groupManagerRepository->findOneBy(Array("user" => $user->getId(), "group" => $groupId));

            $user->setExterne($externe);
            $this->doctrine->persist($user);
            $this->doctrine->flush();
            return true;
        }

        return false;
    }

}