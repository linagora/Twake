<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 17/01/2017
 * Time: 14:34
 */

namespace WebsiteApi\WorkspacesBundle\Controller;


use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceSubscription;
use Doctrine\DBAL\Platforms\Keywords\OracleKeywords;
use WebsiteApi\WorkspacesBundle\Repository\LinkWorkspaceUserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\UsersBundle\Entity\Mail;

class WorkspaceMembersController extends Controller
{

	//TODO enlever cette mocheté (pas en dur !!!)
	var $contacts_mailfrom = "twake@proxima.fr";

	public function tableAction(Request $request) {

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"data" => Array("members" => Array(), "pending_mail" => Array(), "pending_users" => Array()),
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}else {

			$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));


			if($workspace==null){
				$response["errors"][] = "nosuchgroup";

			} elseif (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, "base:members:view")) {
				$response["errors"][] = "notallowed";
			}else {

				$membersA = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->getSomeUsers($workspace,"A", $request->request->getInt("offset"), $request->request->getInt("limit"));
				foreach($membersA as $member){
						$newdata = $member->getUser()->getAsArray();
						$newdata['mail'] = $member->getUser()->getEmail();
						$newdata['role'] = $member->getLevel()->getName();
						$data['data']['members'][] = $newdata;
				}
				$membersW = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->getSomeUsers($workspace,"W", $request->request->getInt("offset"), $request->request->getInt("limit"));
				foreach($membersW as $member){
						$data['data']['pending_mail'][] = Array(
							"mail" => $member->getMail()
						);
				}
				$membersP = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->getSomeUsers($workspace,"P", $request->request->getInt("offset"), $request->request->getInt("limit"));
				foreach($membersP as $member){
						$data['data']['pending_users'][] = $member->getUser()->getAsSimpleArray();
				}

				$data['totalItems'] = $workspace->getMemberCount();
			}

		}

		return new JsonResponse($data);
	}

	/**
	 * Vérifier l'existence d'un utilisateur ou valider une adresse mail
	 */
	public function verifyAction(Request $request){

		$response = Array("status"=>"unknown");

		$request = $request->request->get("request"); // <- The best line ever #request

		$manager = $this->getDoctrine()->getManager();

		if($this->get('app.string_cleaner')->verifyMail($request)){
			$response["status"] = "mail";
		}else{
			$user = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("username_clean"=>$request));
			if($user!=null){
				$response["status"] = "user";
				$response["data"] = Array(
					"cssuserimage"=>$user->getCssProfileImage()
				);
			}
		}

		return new JsonResponse($response);

	}

	/**
	 * Enlever des membres
	 * @param Request $request
	 */
	public function deleteAction(Request $request)
	{

		$response = Array("errors" => Array(), "data" => Array());

		$groupid = $request->request->getInt("groupId");
		$uids = $request->request->get("uids");
		$mails = $request->request->get("mails");


		$manager = $this->getDoctrine()->getManager();
    $group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupid,"isDeleted"=>false));

		$canAccess = false;
		if (count($uids) == 1 && $uids[0] == $this->getUser()->getId()) {
			$canAccess = true;
		}

		if ($group == null) {
			$response["errors"][] = "nosuchgroup";

		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "base:members:remove") && !$canAccess) {
			$response["errors"][] = "notallowed";

		}
		else {

			if (count($uids) != 0) {

				$groupOwnerCount = 0;
				$currentOwnerCount = 0;

				$links = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy(Array("Workspace" => $group));
				foreach ($links as $link) {
					if ($link->getLevel()->getOwner()) {
						++$groupOwnerCount;
					}
				}

				$links = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy(Array("Workspace" => $group, "User" => $uids));
				foreach ($links as $link) {
					if ($link->getLevel()->getOwner()) {
						++$currentOwnerCount;
					}
				}

				if ($groupOwnerCount == $currentOwnerCount) {
					$response["errors"][] = "lastowner";
					return new JsonResponse($response);
 				}
			}

			if (count($uids) != 0) {

				foreach ($uids as $uid) {
					$link = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $uid, "Workspace" => $group));
					if ($link == null) {
						$response["errors"][] = "usernotfound";
						return new JsonResponse($response);
					}
				}
			}

			if (count($mails) != 0) {

				foreach ($mails as $mail) {
					$link = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("mail" => $mail, "Workspace" => $group));
					if ($link == null) {
						$response["errors"][] = "mailnotfound";
						return new JsonResponse($response);
					}
				}
			}

			if (count($uids) != 0) {

				foreach ($uids as $uid) {

					$link = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $uid, "Workspace" => $group));
					$manager->remove($link);
					$linksWorkspace = $manager->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace" => $group));
					$linksChannel = $manager->getRepository("TwakeDiscussionBundle:StreamMember")->findBy(Array("user"=>$uid,"stream"=>$linksWorkspace));
					foreach($linksChannel as $l){
						$manager->remove($l);
					}
					if ($link->getStatus() == "A") {
						$group->setMemberCount($group->getMemberCount() - 1);
					}
				}
			}

			if (count($mails) != 0) {

				foreach ($mails as $mail) {

					if(strlen($mail)>3) {//Check that with give a real mail !
						$link = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("mail" => $mail, "Workspace" => $group));
						$manager->remove($link);

						if ($link->getStatus() == "A") {
							$group->setMemberCount($group->getMemberCount() - 1);
						}
					}
				}
			}

			$manager->persist($group);
			$manager->flush();
		}

		return new JsonResponse($response);

	}




		/**
	 * Vérifier l'existence d'un utilisateur ou valider une adresse mail
	 */
	public function inviteAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$groupid = $request->request->getInt("groupId");
		$request = $request->request->get("request"); // <- The best line ever #request

		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupid,"isDeleted"=>false));

		$linkuser = -1;

		if($group==null){
			$response["errors"][] = "nosuchgroup";

		} elseif (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "base:members:invite")) {
			$response["errors"][] = "notallowed";

		}else {

			$baselevel = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneBy(Array("groupe"=>$group, "isDefault"=>true));

			if($baselevel==null){
				$response["errors"][] = "nodefaultlevel";
				$baselevel = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneBy(Array("groupe"=>$group));
			}

			if ($this->get('app.string_cleaner')->verifyMail($request)) {

				$user = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("email"=>$request));
				if($user==null) {
					$mail = $manager->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("mail"=>$request, "token"=>null));
					if($mail!=null){
						$user = $mail->getUser();
					}
				}
				if($user==null) {

					//Send invitation by mail !
					$member = new LinkWorkspaceUser();
					$member->setMail($request);
					$member->setGroup($group);
					$member->setLevel($baselevel);
					$member->setStatus("W");
					$manager->persist($member);

					$repoMail = $manager->getRepository("TwakeUsersBundle:Mail");
					$second_mail = $repoMail->findOneBy(Array("mail"=>$request));
					if($second_mail==null) {
						$second_mail = new Mail;
						$second_mail->setMail($request);
						$second_mail->newToken();
					}
					$manager->persist($second_mail);

					$verification_token = $second_mail->getToken();

					$data = Array(
						"group" => $group,
						"mail" => $request,
						"token" => $verification_token
					);

					//Sending verification mail
					$message = \Swift_Message::newInstance()
						->setSubject($group->getName())
						->setFrom($this->contacts_mailfrom)
						->setTo($request)
						->setBody(
							$this->render(
								'TwakeUsersBundle:Mail:group_invite_by_mail.html.twig',
								$data
							),
							'text/html'
						)
						->addPart(
							$this->render(
								'TwakeUsersBundle:Mail:group_invite_by_mail.txt.twig',
								$data
							),
							'text/plain'
						)
					;
					$this->get('mailer')->send($message);


				}else{

					$linkuser = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("Workspace" => $group, "User"=>$user));

				}

			} else {

				$user = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("username_clean"=>$request));
				if ($user != null) {

					$linkuser = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $user, "Workspace" => $group));

				}

			}

			//Link to create
      if($linkuser==null) {

        //Add user directly
        $member = new LinkWorkspaceUser();
        $member->setUser($user);
        $member->setGroup($group);
        $member->setLevel($baselevel);
        $member->setStatus("P");
        $manager->persist($member);


        $this->get("app.notifications")->push(
          $user,
          null,
          "group_invitation",
          ["classic", "fast"],
          Array(
              "title" => "Invitation au groupe " . $group->getName(),
              "url" => "account/groups",
              "text" => "",
              "img" => $group->getCSSLogo()
          )
        );
        //Send a notification to the user
        $this->get('app.notifications')->sendUpdateNotif(Array($user->getId()), "updateGroups");
        //Send a notification to the group
        $this->get('app.updateGroup')->push($groupid);

      }

    }

		$manager->flush();

		return new JsonResponse($response);

	}

	public function inviteRefuseAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
    $securityContext = $this->get('security.authorization_checker');
    $data = Array(
      "errors"=>Array(),
    );

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
      $data['errors'][] = "notconnected";
    } else {

      $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));

      if ($workspace == null) {
        $data['errors'][] = "groupnotfound";
      }
      else {
        $member = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $this->getUser(), "Workspace" => $workspace));

        if ($member == null || $member->getStatus() == "A") {
          $data['errors'][] = "noinvitation";
        }
        else {
          $manager->remove($member);
          $manager->flush();
          //Send a notification to the user
          $this->get('app.notifications')->sendUpdateNotif(Array($this->getUser()->getId()), "updateGroups");
          //Send a notification to the group members
          $this->get('app.updateGroup')->push($workspace->getId());
        }
      }
    }

    return new JsonResponse($data);
  }

	public function inviteAcceptAction(Request $request) {

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"errors"=>Array(),
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {

			$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));

			if ($workspace == null) {
				$data['errors'][] = "groupnotfound";
			}
			else {
				$member = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $this->getUser(), "Workspace" => $workspace));

				if ($member == null || $member->getStatus() == "A") {
					$data['errors'][] = "noinvitation";
				}
				else {

					$subscription = $manager->getRepository("TwakeWorkspacesBundle:WorkspaceSubscription")->findOneBy(
						Array("workspace" => $workspace, "user" => $this->getUser())
					);

					if ($subscription == null) {
						$subscription = new WorkspaceSubscription($workspace,$this->getUser());
						$subscription->setDate(new \DateTime());
						$manager->persist($subscription);
					}

					$member->setStatus("A");
					$manager->persist($member);
					$workspace->setMemberCount($workspace->getMemberCount()+1);
					$generalChannel = $manager->getRepository("TwakeDiscussionBundle:Stream")->findOneBy(Array("name"=>"General", "workspace" => $workspace));
					$link = $generalChannel->addMember($this->getUser());
					$manager->persist($link);
					$manager->persist($workspace);
					$manager->flush();
          //Send a notification to the user
          $this->get('app.notifications')->sendUpdateNotif(Array($this->getUser()->getId()), "updateGroups");
          //Send a notification to the group members
          $this->get('app.updateGroup')->push($workspace->getId());
				}
			}
		}

		return new JsonResponse($data);
	}

	public function searchAction(Request $request) {

		$data = Array(
			"errors" => Array(),
		);

		$manager = $this->getDoctrine()->getManager();
		$groupId = $request->request->getInt("groupId",0);
		$search = $request->request->get("search");
		$limit = $request->request->get("limit");
		$offset = $request->request->get("offset");

		if($search==""){
			$data['errors'][] = "nosearch";
		}else if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {

			$usersResults = Array();

			$users = $manager->createQueryBuilder()
				->select('u')
				->from('TwakeUsersBundle:Contact', 'u')
				->where('IDENTITY(u.userB) = :user AND LOWER(u.usernameAcache) LIKE :search')
				->orWhere('IDENTITY(u.userA) = :user AND LOWER(u.usernameBcache) LIKE :search')
				->setParameter('search', mb_strtolower($search) . '%')
				->setParameter('user', $this->getUser()->getId())
				->getQuery()
				->getResult();

			$data['count'] = '%' . mb_strtolower($search);

			foreach ($users as $user) {

				$usertemp = $user->getUserA();
				if($usertemp->getId()==$this->getUser()->getId()) {
					$user = $user->getUserB();
				}else{
					$user = $usertemp;
				}

				$usersResults[] = Array(
					'id' => $user->getId(),
					'username' => $user->getUsername(),
					'cssprofileimage' => $user->getCssProfileImage()
				);

			}

			if($groupId>0) {

				$workspace =
					$manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));
				$member = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $this->getUser(), "Workspace" => $workspace));

				if ($workspace == null) {
					$data['errors'][] = "groupnotfound";
				}
				else if ($member == null) {
					$data['errors'][] = "notingroup";
				} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, "base:members:view")) {
					$data['errors'][] = "notallowed";
				}else{

					$users = $manager->createQueryBuilder()
						->select('u')
						->from('TwakeWorkspacesBundle:LinkWorkspaceUser', 'u')
						->where('IDENTITY(u.Workspace) = :workspace')
						->andWhere('LOWER(u.usernamecache) LIKE :search')
						->setParameter('search', mb_strtolower($search) . '%')
						->setParameter('workspace', $groupId)
						->getQuery()
						->getResult();

					foreach ($users as $user) {

						$user = $user->getUser();

						$usersResults[] = Array(
							'id' => $user->getId(),
							'username' => $user->getUsername(),
							'cssprofileimage' => $user->getCssProfileImage()
						);

					}


				}
			}

			if ($groupId > 0 && $this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, "base:members:view")) {

				$groupMembersLinks = $workspace->getMembers();

				foreach ($groupMembersLinks as $memberLink) {
					if(strpos($memberLink->getUser()->getUsernameClean(), $search)!==false) {
						$usersResults[] = Array(
							'id' => $memberLink->getUser()->getId(),
							'username' => $memberLink->getUser()->getUsername(),
							'cssprofileimage' => $memberLink->getUser()->getCssProfileImage()
						);
					}
				}
			}

			$usersResults = array_unique($usersResults, SORT_REGULAR);
			$usersResults = array_slice($usersResults, $offset, $limit);
			$data['data'] = $usersResults;
		}

		return new JsonResponse($data);
	}
}
