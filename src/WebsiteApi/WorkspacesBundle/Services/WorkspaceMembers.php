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

	public function __construct($doctrine, $workspaces_levels_service, $twake_mailer, $string_cleaner,$pusher,$priceService)
	{
		$this->doctrine = $doctrine;
		$this->wls = $workspaces_levels_service;
		$this->string_cleaner = $string_cleaner;
		$this->twake_mailer = $twake_mailer;
		$this->pusher = $pusher;
        $this->pricing = $priceService;
	}

	public function changeLevel($workspaceId, $userId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){
			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");

			$level = $levelRepository->find($levelId);
			$user = $userRepository->find($userId);
			$workspace = $workspaceRepository->find($workspaceId);

			if($workspace->getUser() != null){
				return false; //Private workspace, only one user as admin
			}

			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
			$member = $workspaceUserRepository->findOneBy(Array("workspace"=>$workspace, "user"=>$user));

			$member->setLevel($level);

			$this->doctrine->persist($member);
			$this->doctrine->flush();

			if($workspace->getUser() != null) {
				$this->twake_mailer->send($user->getEmail(), "changeLevelWorkspaceMail", Array("workspace" => $workspace->getName(), "group" => $workspace->getGroup()->getDisplayName(), "username" => $user->getUsername(), "level"=>$level->getLabel()));
			}

			return true;
		}

		return false;
	}

	public function addMemberByUsername($workspaceId,$username,$asExterne, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){
			$username = $this->string_cleaner->simplifyUsername($username);

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$user = $userRepository->findOneBy(Array("username"=>$username));

			if($user){
				return $this->addMember($workspaceId, $user->getId(), $asExterne);
			}

		}
		return false;
	}

	public function addMemberByMail($workspaceId, $mail,$asExterne, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){

			$mail = $this->string_cleaner->simplifyMail($mail);

			if(!$this->string_cleaner->verifyMail($mail)){
				return false;
			}

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$user = $userRepository->findOneBy(Array("email"=>$mail));

			if($user){
				return $this->addMember($workspaceId, $user->getId(),$asExterne);
			}

			$mailsRepository = $this->doctrine->getRepository("TwakeUsersBundle:Mail");
			$userMail = $mailsRepository->findOneBy(Array("mail"=>$mail));

			if($userMail){
				return $this->addMember($workspaceId, $userMail->getUser()->getId(),$asExterne);
			}

			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			$workspaceUserByMailRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUserByMail");
			$mailObj = $workspaceUserByMailRepository->findOneBy(Array("workspace"=>$workspace, "mail"=>$mail));

			if($mailObj==null){
				//Mail not in tables
				$userByMail = new WorkspaceUserByMail($workspace, $mail);
				$this->doctrine->persist($userByMail);
				$this->doctrine->flush();
			}

			//Send mail
			$this->twake_mailer->send($mail, "inviteToWorkspaceMail", Array(
				"mail" => $mail,
				"workspace" => $workspace->getName(),
				"group" => $workspace->getGroup()->getDisplayName()
			));

		}

		return false;
	}

	public function removeMemberByMail($workspaceId, $mail, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){

			$mail = $this->string_cleaner->simplifyMail($mail);

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$user = $userRepository->findOneBy(Array("email"=>$mail));

			if($user){
				return $this->removeMember($workspaceId, $user->getId());
			}

			$mailsRepository = $this->doctrine->getRepository("TwakeUsersBundle:Mail");
			$userMail = $mailsRepository->findOneBy(Array("mail"=>$mail));

			if($userMail){
				return $this->removeMember($workspaceId, $userMail->getUser()->getId());
			}

			$workspaceUserByMailRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUserByMail");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);
			$userByMail = $workspaceUserByMailRepository->findOneBy(Array("workspace"=>$workspace, "mail"=>$mail));

			$this->doctrine->remove($userByMail);
			$this->doctrine->flush();

		}

		return false;
	}

	public function autoAddMemberByNewMail($mail, $userId)
	{
		$mail = $this->string_cleaner->simplifyMail($mail);
		$workspaceUerByMailRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUserByMail");
		$invitations = $workspaceUerByMailRepository->findBy(Array("mail"=>$mail));

		foreach ($invitations as $userByMail) {
			$this->doctrine->remove($userByMail);
			$this->doctrine->flush();
			$this->addMember($userByMail->getWorkspace()->getId(), $userId);
		}

		return true;
	}

	public function addMember($workspaceId, $userId,$asExterne, $levelId = null, $currentUserId = null)
	{
		if($currentUserId == null || $this->wls->can($workspaceId, $currentUserId, "workspace:write")){
			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$user = $userRepository->find($userId);
			$workspace = $workspaceRepository->find($workspaceId);

            if($workspace->getGroup()!=null) {
                $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
                $nbuserGroup = $groupUserRepository->findBy(Array("group" => $workspace->getGroup(),));
                $limit = $this->pricing->getLimitation($workspace->getGroup()->getId(), "maxUSer", PHP_INT_MAX);

                if (count($nbuserGroup) >= $limit) {
                    return false;
                }
            }
            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
			$member = $workspaceUserRepository->findOneBy(Array("workspace"=>$workspace, "user"=>$user));


			if($member!=null){
			    error_log("already added");
				return false; //Already added
			}

			if($workspace->getUser() != null && $workspace->getUser()->getId()!=$userId){
                error_log("private workspace");
				return false; //Private workspace, only one user
			}

			if(!$levelId || $levelId==null) {
				$level = $this->wls->getDefaultLevel($workspaceId);
			}else{
				$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
				$level = $levelRepository->find($levelId);
			}
			$member = new WorkspaceUser($workspace, $user, $level);

			$workspace->setMemberCount($workspace->getMemberCount()+1);

            $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $groupmember = $groupUserRepository->findOneBy(Array("group"=>$workspace->getGroup(), "user"=>$user));

            if (!$groupmember){
                $groupmember = new GroupUser($workspace->getGroup(),$user);
                $groupmember->increaseNbWorkspace();
                $groupmember->setLevel(0);
                if($asExterne){
                    $groupmember->setExterne(true);
                }
            }else{
                $groupmember->increaseNbWorkspace();
                if($asExterne){
                    $groupmember->setExterne(true);
                }
            }
            $member->setGroupUser($groupmember);

            $this->doctrine->persist($workspace);
			$this->doctrine->persist($member);
            $this->doctrine->persist($groupmember);
			$this->doctrine->flush();

            $datatopush = Array(
                "type"=>"GROUP",
                "action" => "addWorkspace",
                "data"=>Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "notifications/".$user->getId());

			if($workspace->getGroup() != null && $userId!=$currentUserId) {
				$this->twake_mailer->send($user->getEmail(), "addedToWorkspaceMail", Array("workspace" => $workspace->getName(), "username" => $user->getUsername(), "group" => $workspace->getGroup()->getDisplayName()));
			}


			return true;
		}

		return false;
	}

	public function removeMember($workspaceId, $userId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){

			if($userId == $currentUserId){
				if(count($this->getMembers($workspaceId))==1){
					return false; // can't remove myself if I'm the last
				}
			}

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$user = $userRepository->find($userId);
			$workspace = $workspaceRepository->find($workspaceId);

			if($workspace->getUser() != null){
				return false; //Private workspace, only one user
			}

			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
			$member = $workspaceUserRepository->findOneBy(Array("workspace"=>$workspace, "user"=>$user));

            $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $groupmember = $groupUserRepository->findOneBy(Array("group"=>$workspace->getGroup(), "user"=>$user));

            $groupmember->decreaseNbWorkspace();
            $this->doctrine->persist($groupmember);

            $datatopush = Array(
                "action" => "RM",
                "data"=>Array(
                    "id" => $user->getId(),
                    "workspaceId" => $workspace->getId(),
                )
            );

            $this->pusher->push($datatopush, "group/".$workspace->getId());

            $workspace->setMemberCount($workspace->getMemberCount()-1);

            $this->doctrine->persist($workspace);
            $this->doctrine->remove($member);
			$this->doctrine->flush();

			$this->twake_mailer->send($user->getEmail(), "removedFromWorkspaceMail", Array("workspace"=>$workspace->getName(), "username"=>$user->getUsername(), "group" => $workspace->getGroup()->getDisplayName()));

			return true;
		}

		return false;
	}

	public function removeAllMember($workspaceId){
		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
		$workspace = $workspaceRepository->find($workspaceId);

		if(!$workspace){
			return false; //Private workspace, only one user
		}

		$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
		$members = $workspaceUserRepository->findBy(Array("workspace"=>$workspace));

		foreach ($members as $member){
			$this->removeMember($workspaceId,$member->getUser()->getId());
		}

		$this->doctrine->flush();
		return true;

	}

	public function getMembers($workspaceId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "")
		){
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

			$workspace = $workspaceRepository->find($workspaceId);

			if (!$workspace) {
				return false;
			}

			$link = $workspaceUserRepository->findBy(Array("workspace" => $workspace));

			$users = Array();
			foreach($link as $user){
				$users[] = Array(
					"user"=> $user->getUser(),
					"level"=> $user->getLevel(),
                    "externe"=> $user->getGroupUser()->getExterne()
				);
			}

			return $users;
		}

		return false;
	}

	public function getPendingMembers($workspaceId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "")
		){
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
        error_log("---- count:".count($link));
		$workspaces = Array();
		foreach($link as $workspace){
			if($workspace->getWorkspace()->getUser()==null) {
				$workspaces[] = $workspace->getWorkspace();
			}
		}

		return $workspaces;
	}

    public function init($workspaceUser)
    {
        $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $groupmember = $groupUserRepository->findOneBy(Array("group"=>$workspaceUser->getWorkspace()->getGroup(), "user"=>$workspaceUser->getUser()));

        if ($groupmember){
            $workspaceUser->setGroupUser($groupmember);
            $this->doctrine->persist($workspaceUser);
            $this->doctrine->flush();
        }
    }
}