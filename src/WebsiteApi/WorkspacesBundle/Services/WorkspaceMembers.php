<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\GroupUser;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUserByMail;
use WebsiteApi\WorkspacesBundle\Model\WorkspaceMembersInterface;

class WorkspaceMembers implements WorkspaceMembersInterface
{

    private $wls;
    private $string_cleaner;
    private $twake_mailer;
    private $doctrine;
    private $pusher;
    private $pricing;
    private $calendar;
    /* @var WorkspacesActivities $workspacesActivities*/
    var $workspacesActivities;
    var $groupManager;

    public function __construct($doctrine, $workspaces_levels_service, $twake_mailer, $string_cleaner, $pusher, $priceService, $calendar, $workspacesActivities, $groupManager)
    {
        $this->doctrine = $doctrine;
        $this->wls = $workspaces_levels_service;
        $this->string_cleaner = $string_cleaner;
        $this->twake_mailer = $twake_mailer;
        $this->pusher = $pusher;
        $this->pricing = $priceService;
        $this->calendar = $calendar;
        $this->workspacesActivities = $workspacesActivities;
        $this->groupManager = $groupManager;
    }

    public function changeLevel($workspaceId, $userId, $levelId, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");

            $level = $levelRepository->findOneBy(Array("workspace"=>$workspaceId,"id"=>$levelId));
            $user = $userRepository->find($userId);
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getUser() != null) {
                return false; //Private workspace, only one user as admin
            }

            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $user));

            $member->setLevelId($level->getId());

            $this->doctrine->persist($member);
            $this->doctrine->flush();

            if ($workspace->getUser() != null) {
                $this->twake_mailer->send($user->getEmail(), "changeLevelWorkspaceMail", Array("_language" => $user ? $user->getLanguage() : "en", "workspace" => $workspace->getName(), "group" => $workspace->getGroup()->getDisplayName(), "username" => $user->getUsername(), "level" => $level->getLabel()));
            }
            $workspaceUser = $member->getAsArray();
            $workspaceUser["groupLevel"] = $this->groupManager->getLevel($workspace->getGroup(),$userId,$currentUserId);
            $dataToPush = Array(
                "type" => "update_workspace_level",
                "workspace_user" => $workspaceUser
            );
            $this->pusher->push($dataToPush, "workspace_users/" . $workspace->getId());

            $dataToPush = Array(
                "type" => "update_workspace_level",
                "workspace" => $level->getAsArray()
            );
            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);

            return true;
        }
        return false;
    }

    public function addMemberByUsername($workspaceId, $username, $asExterne,$autoAddExterne, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {
            $username = $this->string_cleaner->simplifyUsername($username);

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $user = $userRepository->findOneBy(Array("usernamecanonical" => $username));
            if ($user) {
                return $this->addMember($workspaceId, $user->getId(), $asExterne,$autoAddExterne);
            }

        }
        return false;
    }

    // return false if error, user if user already have an account, mail if invitation mail sent
    public function addMemberByMail($workspaceId, $mail, $asExterne,$autoAddExterne, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $mail = $this->string_cleaner->simplifyMail($mail);

            if (!$this->string_cleaner->verifyMail($mail)) {
                return false;
            }

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $currentUser = null;
            if ($currentUserId) {
                $currentUser = $userRepository->find($currentUserId);
            }
            $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));

            if ($user) {
                $uOk = $this->addMember($workspaceId, $user->getId(), $asExterne,$autoAddExterne);
                if($uOk){
                    return "user";
                }
                return false;
            }

            $mailsRepository = $this->doctrine->getRepository("TwakeUsersBundle:Mail");
            $userMail = $mailsRepository->findOneBy(Array("mail" => $mail));

            if ($userMail) {
                $mOk = $this->addMember($workspaceId, $userMail->getUser(), $asExterne,$autoAddExterne);
                if($mOk){
                    return "user";
                }
                return false;
            }

            $retour = false;
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            $workspaceUserByMailRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUserByMail");
            $mailObj = $workspaceUserByMailRepository->findOneBy(Array("workspace" => $workspaceId, "mail" => $mail));

            if ($mailObj == null) {
                //Mail not in tables
                $userByMail = new WorkspaceUserByMail($workspace, $mail);
                $userByMail->setExterne($asExterne);
                $userByMail->setAutoAddExterne($autoAddExterne);
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

            $workspaceUserByMailRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUserByMail");
            $workspaceUserByMailRepository->removeBy(Array("workspace" => $workspaceId, "mail" => $mail));

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));

            if ($user) {
                return "user ".$this->removeMember($workspaceId, $user->getId());
            }

            $mailsRepository = $this->doctrine->getRepository("TwakeUsersBundle:Mail");
            $userMail = $mailsRepository->findOneBy(Array("mail" => $mail));

            if ($userMail) {
                return "mail ".$this->removeMember($workspaceId, $userMail->getUser()->getId());
            }

            $this->doctrine->flush();
        }

        return "not allowed //";
    }

    public function autoAddMemberByNewMail($mail, $userId)
    {
        error_log("auto add member by mail ".$mail);
        $mail = $this->string_cleaner->simplifyMail($mail);
        $workspaceUerByMailRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUserByMail");
        $invitations = $workspaceUerByMailRepository->findBy(Array("mail" => $mail));

        foreach ($invitations as $userByMail) {
            error_log("mail :".$userByMail->getMail());
            $this->doctrine->remove($userByMail);
            $this->doctrine->flush();
            $this->addMember($userByMail->getWorkspace()->getId(), $userId, $userByMail->getExterne(),$userByMail->getAutoAddExterne());
        }

        return true;
    }

    public function addMember($workspaceId, $userId, $asExterne = false,$autoAddExterne=false, $levelId = null, $currentUserId = null)
    {
        if ($currentUserId == null || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {
            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

            $user = $userRepository->find($userId);
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getUser() != null && $currentUserId != null && $currentUserId != $userId) { //No other members in private group
                return;
            }

            if ($workspace->getGroup() != null) {
                $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
                $nbuserGroup = $groupUserRepository->findBy(Array("group" => $workspace->getGroup()));
                $limit = $this->pricing->getLimitation($workspace->getGroup()->getId(), "maxUser", PHP_INT_MAX);

                if (count($nbuserGroup) >= $limit) { // Margin of 1 to be sure we do not count twakebot
                    return false;
                }
            }
            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
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
                $levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
                $level = $levelRepository->findOneBy(Array("workspace" => $workspaceId, "id" => $levelId));
            }
            $member = new WorkspaceUser($workspace, $user, $level->getId());
            $member->setExterne($asExterne);
            $member->setAutoAddExterne($autoAddExterne);


            $workspace->setMemberCount($workspace->getMemberCount() + 1);

            $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $groupmember = $groupUserRepository->findOneBy(Array("group" => $workspace->getGroup(), "user" => $user));

            if (!$groupmember) {
                $groupmember = new GroupUser($workspace->getGroup(), $user);
                $groupmember->increaseNbWorkspace();
                $groupmember->setLevel(0);
            } else {
                $groupmember->increaseNbWorkspace();
            }
            $groupmember->setExterne(false);

            $this->doctrine->persist($workspace);
            $this->doctrine->persist($member);
            $this->doctrine->persist($groupmember);
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

    public function removeMember($workspaceId, $userId, $currentUserId = null)
    {
        if ($currentUserId == null
            || $userId == $currentUserId
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $total_membres = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId))->getMemberCount();

            if ($userId == $currentUserId) {
                if ($total_membres == 1) {
                    return false; // can't remove myself if I'm the last
                }
            }

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

            $user = $userRepository->find($userId);
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getUser() != null) {
                return false; //Private workspace, only one user
            }

            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $member = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $user));

            if (!$member) {
                return false;
            }

            $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $groupmember = $groupUserRepository->findOneBy(Array("group" => $workspace->getGroup(), "user" => $user));
            $groupmember->decreaseNbWorkspace();
            $this->doctrine->persist($groupmember);

            //If multiple users
            if ($total_membres > 1) {

                //Test if other workspace administrators are present
                $level = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel")->findOneBy(Array("workspace" => $workspace->getId(), "id" => $member->getLevelId()));

                if ($currentUserId != null && $level->getisAdmin()) {
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
            $workspace_user["nbWorkspace"] = $groupmember!=null?$groupmember->getNbWorkspace():0;

            $dataToPush = Array(
                "type" => "remove",
                "workspace_user" =>$workspace_user,
            );
            $this->pusher->push($dataToPush, "workspace_users/" . $workspace->getId());
            $dataToPush = Array(
                "type" => "remove",
                "workspace" => $workspace->getAsArray(),
            );

            $this->pusher->push($dataToPush, "workspaces_of_user/" . $userId);

            /*$datatopush = Array(
                "type" => "CHANGE_MEMBERS",
                "data" => Array(
                    "id" => $userId,
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());

            $datatopush = Array(
                "action" => "RM",
                "data" => Array(
                    "id" => $user->getId(),
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());*/

            if ($member) {
                $workspace->setMemberCount($workspace->getMemberCount() - 1);
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

    public function removeAllMember($workspaceId)
    {
        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->find($workspaceId);

        if (!$workspace) {
            return false; //Private workspace, only one user
        }

        $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
        $members = $workspaceUserRepository->findBy(Array("workspace" => $workspace));

        foreach ($members as $member) {
            $this->removeMember($workspaceId, $member->getUser()->getId());
        }

        $this->doctrine->flush();
        return true;

    }

    public function getMembers($workspaceId, $currentUserId = null, $order = Array("last_access" => "DESC"), $max = 0, $offset = 0)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

            $workspace = $workspaceRepository->find($workspaceId);

            if (!$workspace) {
                return false;
            }

            $link = $workspaceUserRepository->findBy(Array("workspace" => $workspace), $order, $max, $offset, "user");
            $users = Array();
            foreach ($link as $user) {

                $group_user = $groupUserRepository->findOneBy(Array("user" => $user->getUser()->getId(), "group" => $workspace->getGroup()));
                $groupId = $workspace->getGroup();
                if($group_user){
                    $users[] = Array(
                        "user" => $user->getUser(),
                        "last_access" => $user->getLastAccess() ? $user->getLastAccess()->getTimestamp() : null,
                        "level" => $user->getLevelId(),
                        "externe" => $user->getExterne(),
                        "autoAddExterne" => $user->getAutoAddExterne(),
                        "groupLevel" => $this->groupManager->getLevel($groupId,$user->getUser()->getId(),$currentUserId)
                    );

                }
                else{
                    error_log("error group user, ".$user->getUser()->getId().",".$workspace->getGroup()->getId());
                }

            }

            return $users;
        }

        return false;
    }

    public function getPendingMembers($workspaceId, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspaceUserByMailRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUserByMail");

            $workspace = $workspaceRepository->find($workspaceId);

            if (!$workspace) {
                return false;
            }

            $mails = $workspaceUserByMailRepository->findBy(Array("workspace" => $workspace));

            return $mails;
        }

        return false;
    }

    public function getWorkspaces($userId)
    {
        $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
        $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
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

    public function updateChannelAfterAddWorkspaceMember($workspace, $user)
    {
        $workspaceMember = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace"=>$workspace,"user"=>$user));
        if($workspaceMember){
            $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(
                Array("original_workspace_id" => $workspace->getId(), "direct" => false)
            );

            foreach ($channels as $channel_entity) {

                $isInChannel = false;
                $mails = $this->doctrine->getRepository("TwakeUsersBundle:Mail")->findBy(Array("user"=>$user));
                $channelExt = $channel_entity->getExtMembers();
                foreach($mails as $mail){
                    if(in_array($mail->getMail(),$channelExt)){
                        $isInChannel = true;
                    }
                }
                if (!$channel_entity->getPrivate() && (!$workspaceMember->getExterne() || $workspaceMember->getExterne() && $workspaceMember->getAutoAddExterne() || $workspaceMember->getExterne() && (in_array($user->getId(),$channel_entity->getExtMembers()) || $isInChannel ))) {
                    $member = new \WebsiteApi\ChannelsBundle\Entity\ChannelMember($user->getId()."", $channel_entity);
                    $member->setLastMessagesIncrement($channel_entity->getMessagesIncrement());
                    $this->doctrine->persist($member);
                    if(!$workspaceMember->getExterne()){
                        //membre du ws
                        $channel_entity->setMembers(array_merge($channel_entity->getMembers(), [$user->getId()]));
                    }else{
                        // externe
                        if(!array_search($user->getId(),$channelExt)){
                            $channel_entity->setExtMembers(array_merge($channel_entity->getExtMembers(), [$user->getId()]));
                        }
                        if(!$workspaceMember->getAutoAddExterne()){
                            // c'est un chaviter d'espace
                            $mails = $this->doctrine->getRepository("TwakeUsersBundle:Mail")->findBy(Array("user"=>$user->getId()));
                            $channelExt = $channel_entity->getExtMembers();
                            foreach($mails as $mail){
                                if(($index = array_search($mail->getMail(),$channelExt))){
                                    array_splice($channelExt,$index,1);
                                }
                            }
                        }
                    }
                    $this->doctrine->persist($channel_entity);
                }
            }
            $this->doctrine->flush();
        }
    }


    public function delWorkspaceMember_temp($workspace, $user)
    {
        $membersRepo = $this->doctrine->getRepository("TwakeChannelsBundle:ChannelMember");
        $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(
            Array("original_workspace_id" => $workspace->getId(), "direct" => false)
        );

        foreach ($channels as $channel_entity) {
            $member = $membersRepo->findOneBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user_id" => $user));
            if($member){
                $this->doctrine->remove($member);
                $channel_entity->setMembers(array_diff($channel_entity->getMembers(), [$user->getId()]));
            }
            $this->doctrine->persist($channel_entity);
        }
        $this->doctrine->flush();
    }
}