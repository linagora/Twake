<?php

namespace Twake\Workspaces\Services;

use Twake\Users\Entity\User;
use Twake\Workspaces\Entity\GroupUser;
use Twake\Workspaces\Entity\WorkspaceUser;
use Twake\Workspaces\Entity\WorkspaceUserByMail;
use Twake\Workspaces\Model\WorkspaceMembersInterface;
use App\App;

class WorkspaceMembers
{

    /* @var WorkspacesActivities $workspacesActivities */
    var $workspacesActivities;
    var $groupManager;
    private $app;
    private $wls;
    private $string_cleaner;
    private $doctrine;
    private $pusher;
    private $calendar;
    private $queues;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->wls = $app->getServices()->get("app.workspace_levels");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
        $this->pusher = $app->getServices()->get("app.pusher");
        $this->calendar = $app->getServices()->get("app.calendar.calendar");
        $this->workspacesActivities = $app->getServices()->get("app.workspaces_activities");
        $this->groupManager = $app->getServices()->get("app.group_managers");
        $this->queues = $app->getServices()->get('app.queues')->getAdapter();
    }

    public function changeLevel($workspaceId, $userId, $levelId, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $levelRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceLevel");

            $level = $levelRepository->findOneBy(Array("workspace" => $workspaceId, "id" => $levelId));
            $user = $userRepository->find($userId);
            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace_id" => $workspace->getId(), "user_id" => $user->getId()));

            $member->setLevelId($level->getId());
            if($level->getIsAdmin()){
                $member->setRole("moderator");
            }else{
                $member->setRole("member");
            }

            $this->doctrine->persist($member);
            $this->doctrine->flush();

            $workspaceUser = $member->getAsArray($this->doctrine);
            $workspaceUser["groupLevel"] = $this->groupManager->getLevel($workspace->getGroup(), $userId, $currentUserId);
            $dataToPush = Array(
                "type" => "update_workspace_level",
                "workspace_user" => $workspaceUser
            );
            $this->pusher->push($dataToPush, "workspace_users/" . $workspace->getId());

            $dataToPush = Array(
                "type" => "update_workspace_level",
                "level" => $level->getAsArray()
            );
            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);

            return true;
        }
        return false;
    }

    public function addMemberByUsername($workspaceId, $username, $asExterne, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {
            $username = $this->string_cleaner->simplifyUsername($username);

            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $user = $userRepository->findOneBy(Array("usernamecanonical" => $username));
            if ($user) {
                return $this->addMember($workspaceId, $user->getId(), $asExterne);
            }

        }
        return false;
    }

    // return false if error, user if user already have an account, mail if invitation mail sent

    public function addMember($workspaceId, $userId, $asExterne = false, $levelId = null, $currentUserId = null)
    {
        if ($currentUserId == null || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {
            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");

            $user = $userRepository->find($userId);
            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            if ($workspace->getGroup() != null) {
                $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
                $nbuserGroup = $groupUserRepository->findBy(Array("group" => $workspace->getGroup()));
            }
            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace_id" => $workspace->getId(), "user_id" => $user->getId()));


            if ($member != null) {
                return false; //Already added
            }

            if (!$levelId || $levelId == null) {
                $level = $this->wls->getDefaultLevel($workspaceId);
            } else {
                $levelRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceLevel");
                $level = $levelRepository->findOneBy(Array("workspace" => $workspaceId, "id" => $levelId));
            }
            $member = new WorkspaceUser($workspace, $user, $level->getId());
            $member->setExterne($asExterne);

            if($asExterne){
                $workspace->setGuestCount($workspace->getGuestCount() + 1);
            }else{
                $workspace->setMemberCount($workspace->getMemberCount() + 1);
            }

            $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
            $groupmember = $groupUserRepository->findOneBy(Array("group" => $workspace->getGroup(), "user" => $user));
            $group = $groupRepository->findOneBy(["id" => $workspace->getGroup()]);

            if (!$groupmember) {
                $groupmember = new GroupUser($workspace->getGroup(), $user);
                $groupmember->increaseNbWorkspace();
                $groupmember->setLevel(0);
                $group->setMemberCount($group->getMemberCount() + 1);
            } else {
                $groupmember->increaseNbWorkspace();
            }
            $groupmember->setExterne(false);

            $this->doctrine->persist($workspace);
            $this->doctrine->persist($member);
            $this->doctrine->persist($groupmember);
            $this->doctrine->persist($group);
            $this->doctrine->flush();


            $dataToPush = Array(
                "type" => "add",
                "workspace_user" => $member->getAsArray($this->doctrine)
            );
            $this->pusher->push($dataToPush, "workspace_users/" . $workspace->getId());

            $dataToPush = Array(
                "type" => "add",
                "workspace" => $workspace->getAsArray($this->doctrine)
            );
            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);
            
            $this->queues->push("workspace:member:added", [
                "company_id" => $workspace->getGroup(),
                "workspace_id" => $workspaceId,
                "user_id" => $userId
            ], ["exchange_type" => "fanout"]);
            
            $this->updateChannelAfterAddWorkspaceMember($workspace, $user);

            $this->updateUser($user);

            return true;
        }

        return false;
    }

    public function updateChannelAfterAddWorkspaceMember($workspace, $user)
    {
        $workspaceMember = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findOneBy(Array("workspace_id" => $workspace->getId(), "user_id" => $user->getId()));
        if ($workspaceMember) {
            $channels = $this->doctrine->getRepository("Twake\Channels:Channel")->findBy(
                Array("original_workspace_id" => $workspace->getId(), "direct" => false)
            );

            foreach ($channels as $channel_entity) {

                $isInChannel = false;
                $mails = $this->doctrine->getRepository("Twake\Users:Mail")->findBy(Array("user_id" => $user));
                $channelExt = $channel_entity->getExtMembers();
                if (!$channelExt) {
                    $channelExt = Array();
                }
                foreach ($mails as $mail) {
                    if (in_array($mail->getMail(), $channelExt)) {
                        $isInChannel = true;
                    }
                }
                if (!$channel_entity->getPrivate() && (!$workspaceMember->getExterne() || $workspaceMember->getExterne() && $workspaceMember->getAutoAddExterne() || $workspaceMember->getExterne() && (in_array($user->getId(), $channel_entity->getExtMembers()) || $isInChannel))) {
                    $member = new \Twake\Channels\Entity\ChannelMember($user->getId() . "", $channel_entity);
                    $member->setLastMessagesIncrement($channel_entity->getMessagesIncrement());
                    $this->doctrine->persist($member);
                    if (!$workspaceMember->getExterne()) {
                        //membre du ws
                        $channel_entity->setMembers(array_merge($channel_entity->getMembers(), [$user->getId()]));
                    } else {
                        // externe
                        if (array_search($user->getId(), $channelExt) === false) {
                            $channel_entity->setExtMembers(array_merge($channel_entity->getExtMembers(), [$user->getId()]));
                        }
                        if (!$workspaceMember->getAutoAddExterne()) {
                            // c'est un chaviter d'espace
                            $mails = $this->doctrine->getRepository("Twake\Users:Mail")->findBy(Array("user_id" => $user->getId()));
                            $channelExt = $channel_entity->getExtMembers();
                            foreach ($mails as $mail) {
                                if (($index = array_search($mail->getMail(), $channelExt)) !== false) {
                                    array_splice($channelExt, $index, 1);
                                }
                            }
                            $channel_entity->setExtMembers($channelExt);
                        }
                    }
                    $this->doctrine->persist($channel_entity);
                }
            }
            $this->doctrine->flush();
        }
    }

    public function addMemberByMail($workspaceId, $mail, $asExterne, $currentUserId = null, $sendEmail = true)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $mail = $this->string_cleaner->simplifyMail($mail);

            if (!$this->string_cleaner->verifyMail($mail)) {
                return false;
            }

            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $currentUser = null;
            if ($currentUserId) {
                $currentUser = $userRepository->find($currentUserId);
            }
            $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));

            if ($user) {
                $uOk = $this->addMember($workspaceId, $user->getId(), $asExterne);
                if ($uOk) {
                    return "user";
                }
                return false;
            }

            $mailsRepository = $this->doctrine->getRepository("Twake\Users:Mail");
            $userMail = $mailsRepository->findOneBy(Array("mail" => $mail));

            if ($userMail) {
                $user_id = $userMail->getUserId();
                $user = $userRepository->find($user_id);
                $mOk = $this->addMember($workspaceId, $user, $asExterne);
                if ($mOk) {
                    return "user";
                }
                return false;
            }

            $retour = false;
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            $workspaceUserByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");
            $mailObj = $workspaceUserByMailRepository->findOneBy(Array("workspace_id" => $workspaceId, "mail" => $mail));

            if ($mailObj == null) {
                //Mail not in tables
                $userByMail = new WorkspaceUserByMail($workspace, $mail);
                $userByMail->setExterne($asExterne);
                $userByMail->setAutoAddExterne(false);
                $workspace->setPendingCount($workspace->getPendingCount()+1);
                $this->doctrine->persist($workspace);
                $this->doctrine->persist($userByMail);
                $this->doctrine->flush();
                $retour = "mail";
            }
            return $retour;
        }

        return false;
    }

    public function removeMemberByMail($workspaceId, $mail, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {
            $mail = $this->string_cleaner->simplifyMail($mail);

            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            $workspaceUserByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");
            $mails = $workspaceUserByMailRepository->findBy(Array("workspace_id" => $workspaceId, "mail" => $mail));
            foreach($mails as $mailguest){         
                $this->doctrine->remove($mailguest);       
                $workspace->setPendingCount($workspace->getPendingCount() - 1);
            }

            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));

            if ($user) {
                return "user " . $this->removeMember($workspaceId, $user->getId());
            }

            $mailsRepository = $this->doctrine->getRepository("Twake\Users:Mail");
            $userMail = $mailsRepository->findOneBy(Array("mail" => $mail));

            if ($userMail) {
                $user_id = $userMail->getUserId();
                $user = $userRepository->find($user_id);
                return "mail " . $this->removeMember($workspaceId, $user);
            }

            $this->doctrine->flush();

            return "ok";

        }

        return "not allowed";
    }

    public function removeMember($workspaceId, $userId, $currentUserId = null)
    {
        if ($currentUserId == null
            || $userId == $currentUserId
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $total_membres = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspaceId))->getMemberCount();

            if ($userId == $currentUserId) {
                if ($total_membres == 1) {
                    return false; // can't remove myself if I'm the last
                }
            }

            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");

            $user = $userRepository->find($userId);
            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace_id" => $workspace->getId(), "user_id" => $user->getId()));

            if (!$member) {
                return false;
            }

            $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
            $groupmember = $groupUserRepository->findOneBy(Array("group" => $workspace->getGroup(), "user" => $user));
            $groupmember->decreaseNbWorkspace();
            $this->doctrine->persist($groupmember);

            //If multiple users
            if ($total_membres > 1) {

                //Test if other workspace administrators are present
                $level = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceLevel")->findOneBy(Array("workspace" => $workspace->getId(), "id" => $member->getLevelId()));

                if ($currentUserId != null && $level->getIsAdmin()) {
                    $other_workspace_admins = $workspaceUserRepository->findBy(Array("level_id" => $member->getLevelId()));
                    if (count($other_workspace_admins) <= 1) {
                        header("twake-debug: no other workspace admins");
                        return false;
                    }
                }
            }

            //Test if other group administrators are present in case this is the last workspace of the user
            if ($groupmember->getNbWorkspace() <= 0) {
                if ($currentUserId != null && $groupmember->getLevel() == 3) {
                    $otherGroupAdmin = $groupUserRepository->findBy(Array("group" => $workspace->getGroup(), "level" => 3));
                    if (count($otherGroupAdmin) == 1) {
                        header("twake-debug: no other group admins");
                        return false;
                    }
                }
                if ($groupmember) {
                    $this->doctrine->remove($groupmember);
                }
                $groupmember = null;
            }


            $workspace_user = $member->getAsArray($this->doctrine);
            $workspace_user["nbWorkspace"] = $groupmember != null ? $groupmember->getNbWorkspace() : 0;

            $dataToPush = Array(
                "type" => "remove",
                "workspace_user" => $workspace_user,
            );
            $this->pusher->push($dataToPush, "workspace_users/" . $workspace->getId());
            $dataToPush = Array(
                "type" => "remove",
                "workspace" => $workspace->getAsArray($this->doctrine),
            );
            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);
            
            $this->queues->push("workspace:member:removed", [
                "company_id" => $workspace->getGroup(),
                "workspace_id" => $workspaceId,
                "user_id" => $userId
            ], ["exchange_type" => "fanout"]);

            if ($member) {
                if($member->getExterne()){
                    $workspace->setGuestCount($workspace->getGuestCount() - 1);
                }else{
                    $workspace->setMemberCount($workspace->getMemberCount() - 1);
                }
                $this->doctrine->persist($workspace);
                $this->doctrine->remove($member);
            }
            $this->doctrine->flush();

            $this->delWorkspaceMember_temp($workspace, $user);

            $this->updateUser($user);

            return true;
        }

        return false;
    }

    public function delWorkspaceMember_temp($workspace, $user)
    {
        $membersRepo = $this->doctrine->getRepository("Twake\Channels:ChannelMember");
        $channels = $this->doctrine->getRepository("Twake\Channels:Channel")->findBy(
            Array("original_workspace_id" => $workspace->getId(), "direct" => false)
        );

        foreach ($channels as $channel_entity) {

            $member = $membersRepo->findOneBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId() . "", "user_id" => $user->getId()));
            if ($member) {
                $this->doctrine->remove($member);
                $channel_entity->setMembers(array_diff($channel_entity->getMembers(), [$user->getId()]));
                $channel_entity->setExtMembers(array_diff($channel_entity->getExtMembers(), [$user->getId()]));
            }
            $this->doctrine->persist($channel_entity);
        }
        $this->doctrine->flush();
    }

    public function autoAddMemberByNewMail($mail, $userId)
    {
        $mail = $this->string_cleaner->simplifyMail($mail);
        $workspaceUerByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");
        $invitations = $workspaceUerByMailRepository->findBy(Array("mail" => $mail));

        foreach ($invitations as $userByMail) {
            $this->doctrine->remove($userByMail);
            $this->doctrine->flush();
            $this->addMember($userByMail->getWorkspaceId(), $userId, $userByMail->getExterne());
        }

        return true;
    }

    public function removeAllMember($workspaceId)
    {
        $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

        if (!$workspace) {
            return false; //Private workspace, only one user
        }

        $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
        $members = $workspaceUserRepository->findBy(Array("workspace_id" => $workspace->getId()));

        foreach ($members as $member) {
            $this->removeMember($workspaceId, $member->getUserId());
        }

        $this->doctrine->flush();
        return true;

    }

    public function getMembersAndPending($workspaceId, $currentUserId, $order = Array("user" => "DESC"), $max = 100, $offset = 0)
    {

        $members = $this->getMembers($workspaceId, $currentUserId, $order, $max, $offset);
        $list = Array();
        foreach ($members as $member) {
            $user = $member["user"]->getAsArray();
            $list[] = Array(
                "user" => $user,
                "last_access" => $member["last_access"],
                "level" => $member["level"],
                "externe" => $member["externe"],
                "groupLevel" => $member["groupLevel"]
            );
        }

        $pendingMails = $this->getPendingMembers($workspaceId, $currentUserId);

        $listMails = Array();
        foreach ($pendingMails as $mail) {
            $listMails[] = Array(
                "mail" => $mail->getMail(),
                "externe" => $mail->getExterne()
            );
        }

        return Array(
            "mails" => $listMails,
            "members" => $list
        );

    }

    public function searchMembers($workspaceId, $currentUserId = null, $query)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");

            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            if (!$workspace) {
                return false;
            }

            $usersService = $this->app->getServices()->get("app.users");

            $results = $usersService->search([
                "name" => $query,
                "workspace_id" => $workspaceId,
                "scope" => "workspace"
            ], true);

            if($results){
                $results = $results["users"];
            }else{
                $results = [];
            }
            
            $members = [];
            foreach($results as $user){
                if($user[0]){
                    $link = $workspaceUserRepository->findOneBy(Array("workspace_id" => $workspace->getId(), "user_id" => $user[0]->getId()));
                    $v = $this->memberFromLink($workspace, $currentUserId, $user[0], $link);
                    if($v){
                        $members[] = $v;
                    }
                }
            }

            return $members;

        }

        return false;

    }

    public function getMembers($workspaceId, $currentUserId = null, $order = Array("user" => "DESC"), $max = 100, $offset = 0)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            if (!$workspace) {
                return false;
            }

            $links = $workspaceUserRepository->findBy(Array("workspace_id" => $workspace->getId()), Array(), $max, $offset, "user_id", "ASC");
            $users = Array();
            foreach ($links as $link) {
                $userEntity = $link->getUser($this->doctrine);
                if($userEntity){
                    $v = $this->memberFromLink($workspace, $currentUserId, $userEntity, $link);
                    if($v){
                        $users[] = $v;
                    }
                }

            }

            return $users;
        }

        return false;
    }

    private function memberFromLink($workspace, $currentUserId, $userEntity, $link){
        $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
        $group_user = $groupUserRepository->findOneBy(Array("user" => $link->getUserId(), "group" => $workspace->getGroup()));
        $groupId = $workspace->getGroup();
        
        $value = null;
        if ($group_user) {
            $value = Array(
                "user" => $userEntity,
                "last_access" => $link->getLastAccess() ? $link->getLastAccess()->getTimestamp() : null,
                "level" => $link->getLevelId(),
                "externe" => $link->getExterne(),
                "workspace_member_id" => $link->getId(),
                "groupLevel" => $this->groupManager->getLevel($groupId, $link->getUserId(), $currentUserId)
            );

        } else {
            error_log("error group user, " . $link->getUserId() . "," . $workspace->getGroup());
        }
        return $value;
    }

    public function getPendingMembers($workspaceId, $currentUserId = null, $max = 100, $offset = 0)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspaceUserByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");

            $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

            if (!$workspace) {
                return false;
            }

            $mails = $workspaceUserByMailRepository->findBy(Array("workspace_id" => $workspace->getId()), Array(), $max, $offset, "mail", "ASC");

            return $mails;
        }

        return false;
    }

    public function getWorkspaces($userId)
    {
        $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
        $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);
        if (!$user) {
            return false;
        }
        $link = $workspaceUserRepository->findBy(Array("user_id" => $user->getId()));
        $workspaces = Array();
        foreach ($link as $workspaceMember) {
            $workspace = $workspaceMember->getWorkspace($this->doctrine);
            if ($workspace && !$workspace->getIsDeleted() && $workspace->getGroup()) {

                $levels = $this->wls->getLevels($workspace->getId(), $userId);
                $isAdmin = false;
                foreach ($levels as $level) {
                    if($level->getId() === $workspaceMember->getLevelId() && $level->getIsAdmin()){
                        $isAdmin = true;
                    }
                }

                if($isAdmin){
                    $workspaceMember->setRole("moderator");
                    $this->doctrine->persist($workspaceMember);
                }

                $groupUser = $groupUserRepository->findOneBy(Array("user" => $user->getId(), "group" => $workspace->getGroup()));

                $workspaces[] = Array(
                    "last_access" => $workspaceMember->getLastAccess(),
                    "workspace" => $workspace,
                    "ishidden" => $workspaceMember->getisHidden(),
                    "isfavorite" => $workspaceMember->getisFavorite(),
                    "_user_is_admin" => $isAdmin,
                    "_user_is_guest" => $workspaceMember->getExterne() || ($groupUser ? $groupUser->getExterne() : true),
                    "_user_is_organization_administrator" => $groupUser ? $groupUser->getLevel() === 3 : false,
                    "hasnotifications" => $workspaceMember->getHasNotifications(),
                    "isArchived" => $workspaceMember->getWorkspace($this->doctrine)->getIsArchived()
                );
            }
        }

        return $workspaces;
    }

    public function updateCountersIfEmpty($workspaceId){
        $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

        $update = false;

        if($workspace->getMemberCount() === 0){
            $workspace->setMemberCount(count($this->getMembers($workspaceId)));
            $update = true;
        }

        if($workspace->getPendingCount() === 0){
            $count = count($this->getPendingMembers($workspaceId));
            $workspace->setPendingCount($count);
            $update = $update || ($count > 0);
        }

        if($update){
            $this->doctrine->persist($workspace);
            $this->doctrine->flush();
        }

    }

    public function updateUser(User $user, $workspaces_ids = null, $groups_ids = null){

        if(!$workspaces_ids){
            $workspaces_obj = $this->getWorkspaces($user->getId() . "");
            $workspaces_ids = Array();
            $groups_ids = Array();
            foreach ($workspaces_obj as $value) {
                if($value && $value["workspace"] && $value["workspace"]->getGroup()){
                    $workspaces_ids[] = $value["workspace"]->getId();
                    $groups_ids[] = $value["workspace"]->getGroup();
                }
            }
            $workspaces_ids = array_values(array_unique($workspaces_ids));
            $groups_ids = array_values(array_unique($groups_ids));
        }

        $user->setWorkspaces($workspaces_ids);
        $user->setGroups($groups_ids);
        $user->setEsIndexed(false);
        $this->doctrine->persist($user);
        $this->doctrine->flush();
    }

}
