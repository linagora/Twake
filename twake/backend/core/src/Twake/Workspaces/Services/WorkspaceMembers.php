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
    private $wls;
    private $string_cleaner;
    private $twake_mailer;
    private $doctrine;
    private $pusher;
    private $pricing;
    private $calendar;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->wls = $app->getServices()->get("app.workspace_levels");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
        $this->twake_mailer = $app->getServices()->get("app.twake_mailer");
        $this->pusher = $app->getServices()->get("app.pusher");
        $this->pricing = $app->getServices()->get("app.pricing_plan");
        $this->calendar = $app->getServices()->get("app.calendar.calendar");
        $this->workspacesActivities = $app->getServices()->get("app.workspaces_activities");
        $this->groupManager = $app->getServices()->get("app.group_managers");
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
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getUser() != null) {
                return false; //Private workspace, only one user as admin
            }

            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $user));

            $member->setLevelId($level->getId());

            $this->doctrine->persist($member);
            $this->doctrine->flush();

            if ($workspace->getUser() != null) {
                $this->twake_mailer->send($user->getEmail(), "changeLevelWorkspaceMail", Array("_language" => $user ? $user->getLanguage() : "en", "workspace" => $workspace->getName(), "group" => $workspace->getGroup()->getDisplayName(), "username" => $user->getUsername(), "level" => $level->getLabel()));
            }
            $workspaceUser = $member->getAsArray();
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

    public function addMemberByUsername($workspaceId, $username, $asExterne, $autoAddExterne, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {
            $username = $this->string_cleaner->simplifyUsername($username);

            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $user = $userRepository->findOneBy(Array("usernamecanonical" => $username));
            if ($user) {
                return $this->addMember($workspaceId, $user->getId(), $asExterne, $autoAddExterne);
            }

        }
        return false;
    }

    // return false if error, user if user already have an account, mail if invitation mail sent

    public function addMember($workspaceId, $userId, $asExterne = false, $autoAddExterne = false, $levelId = null, $currentUserId = null)
    {
        if ($currentUserId == null || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {
            $userRepository = $this->doctrine->getRepository("Twake\Users:User");
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");

            $user = $userRepository->find($userId);
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getUser() != null && $currentUserId != null && $currentUserId != $userId) { //No other members in private group
                return;
            }

            if ($workspace->getGroup() != null) {
                $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
                $nbuserGroup = $groupUserRepository->findBy(Array("group" => $workspace->getGroup()));
                $limit = $this->pricing->getLimitation($workspace->getGroup()->getId(), "maxUser", PHP_INT_MAX);

                if (count($nbuserGroup) >= $limit) { // Margin of 1 to be sure we do not count twakebot
                    return false;
                }
            }
            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $user));


            if ($member != null) {
                return false; //Already added
            }

            if ($workspace->getUser() != null && $workspace->getUser()->getId() != $userId) {
                return false; //Private workspace, only one user
            }

            if (!$levelId || $levelId == null) {
                $level = $this->wls->getDefaultLevel($workspaceId);
            } else {
                $levelRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceLevel");
                $level = $levelRepository->findOneBy(Array("workspace" => $workspaceId, "id" => $levelId));
            }
            $member = new WorkspaceUser($workspace, $user, $level->getId());
            $member->setExterne($asExterne);
            $member->setAutoAddExterne($autoAddExterne);

            if($asExterne){
                $workspace->setGuestCount($workspace->getGuestCount() + 1);
            }else{
                $workspace->setMemberCount($workspace->getMemberCount() + 1);
            }

            $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
            $groupmember = $groupUserRepository->findOneBy(Array("group" => $workspace->getGroup(), "user" => $user));

            if (!$groupmember) {
                $groupmember = new GroupUser($workspace->getGroup(), $user);
                $groupmember->increaseNbWorkspace();
                $groupmember->setLevel(0);
                $workspace->getGroup()->setMemberCount($workspace->getGroup()->getMemberCount() + 1);
            } else {
                $groupmember->increaseNbWorkspace();
            }
            $groupmember->setExterne(false);

            $this->doctrine->persist($workspace);
            $this->doctrine->persist($member);
            $this->doctrine->persist($groupmember);
            $this->doctrine->persist($workspace->getGroup());
            $this->doctrine->flush();


            $dataToPush = Array(
                "type" => "add",
                "workspace_user" => $member->getAsArray()
            );
            $this->pusher->push($dataToPush, "workspace_users/" . $workspace->getId());

            $dataToPush = Array(
                "type" => "add",
                "workspace" => $workspace->getAsArray()
            );
            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);

            /*            $datatopush = Array(
                            "type" => "CHANGE_MEMBERS",
                            "data" => Array(
                                "id" => $userId,
                                "workspaceId" => $workspace->getId(),
                            )
                        );
                        $this->pusher->push($datatopush, "group/" . $workspace->getId());

                        $datatopush = Array(
                            "type" => "GROUP",
                            "action" => "addWorkspace",
                            "data" => Array(
                                "workspaceId" => $workspace->getId(),
                            )
                        );
                        $this->pusher->push($datatopush, "notifications/" . $user->getId());*/

            if ($workspace->getGroup() != null && $userId != $currentUserId) {
                $this->twake_mailer->send($user->getEmail(), "addedToWorkspaceMail", Array("_language" => $user ? $user->getLanguage() : "en", "workspace" => $workspace->getName(), "username" => $user->getUsername(), "group" => $workspace->getGroup()->getDisplayName()));
            }


//            $this->workspacesActivities->recordActivity($workspace, $user->getId(), "workspace", "workspace.activity.workspace.add_member");
//            $this->messages->addWorkspaceMember($workspace, $user);
//            $this->calendar->addWorkspaceMember($workspace, $user);
            $this->updateChannelAfterAddWorkspaceMember($workspace, $user);

            return true;
        }

        return false;
    }

    public function updateChannelAfterAddWorkspaceMember($workspace, $user)
    {
        $workspaceMember = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findOneBy(Array("workspace" => $workspace, "user" => $user));
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

    public function addMemberByMail($workspaceId, $mail, $asExterne, $autoAddExterne, $currentUserId = null)
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
                $uOk = $this->addMember($workspaceId, $user->getId(), $asExterne, $autoAddExterne);
                if ($uOk) {
                    return "user";
                }
                return false;
            }

            $mailsRepository = $this->doctrine->getRepository("Twake\Users:Mail");
            $userMail = $mailsRepository->findOneBy(Array("mail" => $mail));

            if ($userMail) {
                $mOk = $this->addMember($workspaceId, $userMail->getUser(), $asExterne, $autoAddExterne);
                if ($mOk) {
                    return "user";
                }
                return false;
            }

            $retour = false;
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            $workspaceUserByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");
            $mailObj = $workspaceUserByMailRepository->findOneBy(Array("workspace" => $workspaceId, "mail" => $mail));

            if ($mailObj == null) {
                //Mail not in tables
                $userByMail = new WorkspaceUserByMail($workspace, $mail);
                $userByMail->setExterne($asExterne);
                $userByMail->setAutoAddExterne($autoAddExterne);
                $workspace->setPendingCount($workspace->getPendingCount()+1);
                $this->doctrine->persist($workspace);
                $this->doctrine->persist($userByMail);
                $this->doctrine->flush();
                $retour = "mail";
            }

            //Send mail
            $this->twake_mailer->send($mail, "inviteToWorkspaceMail", Array(
                "_language" => $currentUser ? $currentUser->getLanguage() : "en",
                "mail" => $mail,
                "sender_user" => $currentUser ? $currentUser->getUsername() : "TwakeBot",
                "sender_user_mail" => $currentUser ? $currentUser->getEmail() : "noreply@twakeapp.com",
                "workspace" => $workspace->getName(),
                "group" => $workspace->getGroup()->getDisplayName()
            ));

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

            $workspaceUserByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");
            $mails = $workspaceUserByMailRepository->findBy(Array("workspace" => $workspaceId, "mail" => $mail));
            foreach($mails as $mailguest){         
                $doctrine->remove($mailguest);       
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
                return "mail " . $this->removeMember($workspaceId, $userMail->getUser()->getId());
            }

            $this->doctrine->flush();
        }

        return "not allowed //";
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
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getUser() != null) {
                return false; //Private workspace, only one user
            }

            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $user));

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


            $workspace_user = $member->getAsArray();
            $workspace_user["nbWorkspace"] = $groupmember != null ? $groupmember->getNbWorkspace() : 0;

            $dataToPush = Array(
                "type" => "remove",
                "workspace_user" => $workspace_user,
            );
            $this->pusher->push($dataToPush, "workspace_users/" . $workspace->getId());
            $dataToPush = Array(
                "type" => "remove",
                "workspace" => $workspace->getAsArray(),
            );

            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);

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

            $this->twake_mailer->send($user->getEmail(), "removedFromWorkspaceMail", Array("_language" => $user ? $user->getLanguage() : "en", "workspace" => $workspace->getName(), "username" => $user->getUsername(), "group" => $workspace->getGroup()->getDisplayName()));

            /* $this->messages->delWorkspaceMember($workspace, $user);
             $this->calendar->delWorkspaceMember($workspace, $user);*/
            $this->delWorkspaceMember_temp($workspace, $user);

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
            $this->addMember($userByMail->getWorkspace()->getId(), $userId, $userByMail->getExterne(), $userByMail->getAutoAddExterne());
        }

        return true;
    }

    public function removeAllMember($workspaceId)
    {
        $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $workspaceRepository->find($workspaceId);

        if (!$workspace) {
            return false; //Private workspace, only one user
        }

        $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
        $members = $workspaceUserRepository->findBy(Array("workspace" => $workspace));

        foreach ($members as $member) {
            $this->removeMember($workspaceId, $member->getUser()->getId());
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
                "autoAddExterne" => $member["autoAddExterne"],
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

    public function getMembers($workspaceId, $currentUserId = null, $order = Array("user" => "DESC"), $max = 100, $offset = 0)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");

            $workspace = $workspaceRepository->find($workspaceId);

            if (!$workspace) {
                return false;
            }

            $link = $workspaceUserRepository->findBy(Array("workspace" => $workspace), Array(), $max, $offset);
            $users = Array();
            foreach ($link as $user) {

                $group_user = $groupUserRepository->findOneBy(Array("user" => $user->getUser()->getId(), "group" => $workspace->getGroup()));
                $groupId = $workspace->getGroup();
                
                if ($group_user) {
                    $users[] = Array(
                        "user" => $user->getUser(),
                        "last_access" => $user->getLastAccess() ? $user->getLastAccess()->getTimestamp() : null,
                        "level" => $user->getLevelId(),
                        "externe" => $user->getExterne(),
                        "autoAddExterne" => $user->getAutoAddExterne(),
                        "groupLevel" => $this->groupManager->getLevel($groupId, $user->getUser()->getId(), $currentUserId)
                    );

                } else {
                    error_log("error group user, " . $user->getUser()->getId() . "," . $workspace->getGroup()->getId());
                }

            }

            return $users;
        }

        return false;
    }

    public function getPendingMembers($workspaceId, $currentUserId = null, $max = 100, $offset = 0)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
            $workspaceUserByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");

            $workspace = $workspaceRepository->find($workspaceId);

            if (!$workspace) {
                return false;
            }

            $mails = $workspaceUserByMailRepository->findBy(Array("workspace" => $workspace), Array(), $max, $offset);

            return $mails;
        }

        return false;
    }

    public function getWorkspaces($userId)
    {
        $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
        $userRepository = $this->doctrine->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);
        if (!$user) {
            return false;
        }
        $link = $workspaceUserRepository->findBy(Array("user" => $user));
        $workspaces = Array();
        foreach ($link as $workspace) {
            if ($workspace->getWorkspace()->getUser() == null && $workspace->getWorkspace()->getGroup() != null) {
                $workspaces[] = Array(
                    "last_access" => $workspace->getLastAccess(),
                    "workspace" => $workspace->getWorkspace(),
                    "ishidden" => $workspace->getisHidden(),
                    "isfavorite" => $workspace->getisFavorite(),
                    "hasnotifications" => $workspace->getHasNotifications(),
                    "isArchived" => $workspace->getWorkspace()->getisArchived()
                );
            }
        }

        return $workspaces;
    }

    public function updateCountersIfEmpty($workspaceId){
        $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $workspaceRepository->find($workspaceId);

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

    public function updateUser(User $user, $workspaces_ids, $groups_ids){
        $user->setWorkspaces($workspaces_ids);
        $user->setGroups($groups_ids);
        $user->setEsIndexed(false);
        $this->doctrine->persist($user);
        $this->doctrine->flush();
    }

}