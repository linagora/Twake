<?php

namespace WebsiteApi\StatusBundle\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use WebsiteApi\CommentsBundle\Entity\Like;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\StatusBundle\Entity\Status;
use WebsiteApi\UsersBundle\Entity\User;

class DefaultController extends Controller
{
	public function getPostGroupsAction(Request $request)
	{
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$manager = $this->getDoctrine()->getManager();

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else {

			$groups = $this->getUser()->getWorkspaces();

			foreach ($groups as $group) {
				if ($this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "base:status:post")) {
					$data["data"][] = $group->getAsSimpleArray(false);
				}
			}
		}

		return new JsonResponse($data);
	}

    public function createAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

	    $groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;
	    $content = $request->request->has("content") ? $request->request->get("content") : "";
	    $privacy = $request->request->has("privacy") ? $request->request->get("privacy") : "";
	    $sharedStatusId = $request->request->has("sharedStatusId") ? $request->request->get("sharedStatusId") : 0;
	    $tempFile = isset($_FILES["file"]) ? $_FILES["file"] : null;

	    $manager = $this->getDoctrine()->getManager();
	    $group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));
	    $sharedStatus = $manager->getRepository("TwakeStatusBundle:Status")->find($sharedStatusId);

	    if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
	    	$data["errors"][] = "notconnected";
	    }
	    else if ($groupId != 0 && $group == null) {
		    $data["errors"][] = "groupnotfound";
	    }
	    else if ($content == "" && $tempFile == null) {
		    $data["errors"][] = "emptycontent";
	    }
	    else if ($privacy != "P" && $privacy != "I") {
		    $data["errors"][] = "badprivacy";
	    }
	    else if ($sharedStatusId != 0 && $sharedStatus == null) {
		    $data["errors"][] = "statusnotfound";
	    } else if ($groupId != 0 && !$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "base:status:post")) {
		    $data["errors"][] = "notallowed";
	    }
	    else {
	    	$tempFileId = 0;

			if ($tempFile != null) {

				$uploadResult = $this->get("app.uploader")->uploadFiles($this->getUser(), $tempFile, "status");

				if (count($uploadResult) > 0) {
					if (count($uploadResult[0]["errors"]) > 0) {
						$data["errors"] = array_merge($data["errors"], $uploadResult[0]["errors"]);
					}
					else if ($uploadResult[0]["file"] != null) {
						$tempFileId = $uploadResult[0]["file"]->getId();
					}
				}
				else {
					$data['errors'][] = "unknown";
				}
			}

		    $file = $manager->getRepository("TwakeUploadBundle:File")->find($tempFileId);
			$status = new Status($groupId == 0 ? $this->getUser() : $group, $content, $privacy, $file, $sharedStatus);

			if ($sharedStatus != null) {
				$sharedStatus->addShare();
				$manager->persist($sharedStatus);
			}
		    $manager->persist($status);
			$manager->flush();
	    }

        return new JsonResponse($data);
    }

	public function deleteAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$statusId = $request->request->has("statusId") ? $request->request->get("statusId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$status = $manager->getRepository("TwakeStatusBundle:Status")->find($statusId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($status == null) {
			$data["errors"][] = "statusnotfound";
		} else if ($status->getWorkspace() != null && !$this->get('app.workspace_levels')->hasRight($this->getUser(), $status->getWorkspace(), "base:status:post")) {
			$data["errors"][] = "notallowed";
		}
		else if ($status->getWorkspace() == null && $this->getUser() != $status->getUser()) {
			$data["errors"][] = "notallowed";
		}
		else {
			$likes = $status->getLikesEntities($manager);
			foreach ($likes as $like) {
				$manager->remove($like);
			}

			$comments = $status->getCommentsEntities($manager);
			foreach ($comments as $comment) {
				$manager->remove($comment);
			}

			foreach ($likes as $like) {
				$manager->remove($like);
			}

			if ($status->getSharedStatus() != null) {
				$status->getSharedStatus()->removeShare();
			}

			$manager->remove($status);
			$manager->flush();
		}

		return new JsonResponse($data);
	}

	public function editAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$statusId = $request->request->has("statusId") ? $request->request->get("statusId") : 0;
		$content = $request->request->has("content") ? $request->request->get("content") : "";
		$privacy = $request->request->has("privacy") ? $request->request->get("privacy") : "";

		$manager = $this->getDoctrine()->getManager();
		$status = $manager->getRepository("TwakeStatusBundle:Status")->find($statusId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($statusId == null) {
			$data["errors"][] = "statusnotfound";
		}
		else if ($content == "" && $status->getTempFile() == null) {
			$data["errors"][] = "emptycontent";
		}
		else if ($privacy != "P" && $privacy != "I") {
			$data["errors"][] = "badprivacy";
		} elseif ($status->getWorkspace() != null && !$this->get('app.workspace_levels')->hasRight($this->getUser(), $status->getWorkspace(), "base:status:post")) {
			$data["errors"][] = "notallowed";
		}
		else {
			$status->setContent($content);
			$status->setPrivacy($privacy);
			$manager->persist($status);
			$manager->flush();
		}

		return new JsonResponse($data);
	}

	public function likeAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$statusId = $request->request->has("statusId") ? $request->request->get("statusId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$status = $manager->getRepository("TwakeStatusBundle:Status")->find($statusId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($status == null) {
			$data["errors"][] = "statusnotfound";
		}
		else {

			$like = $status->getLikeEntity($manager, $this->getUser());

			if ($like != null) {
				$status->removeLike();
				$manager->remove($like);
				$manager->persist($status);
				$manager->flush();
			}
			else {
				$like = new Like($this->getUser(), $status);
				$status->addLike();
				$manager->persist($like);
				$manager->persist($status);
				$manager->flush();
			}
		}

		return new JsonResponse($data);
	}

	public function getAction(Request $request)
	{
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$ownerId = $request->request->has("ownerId") ? $request->request->get("ownerId") : 0;
		$isGroup = $request->request->has("ownerIsGroup") ? $request->request->get("ownerIsGroup") : false;
		$limit = $request->request->has("limit") ? $request->request->get("limit") : 0;
		$offset = $request->request->has("offset") ? $request->request->get("offset") : 0;

		$manager = $this->getDoctrine()->getManager();
		$owner = $manager->getRepository($isGroup ? "TwakeWorkspacesBundle:Workspace" : "TwakeUsersBundle:User")->find($ownerId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($owner == null) {
			if ($isGroup) {
				$data["errors"][] = "groupnotfound";
			}
			else {
				$data["errors"][] = "usernotfound";
			}
		}
		else {
			$ownerField = $isGroup ? "workspace" : "user";

			if ($this->get("app.status")->canAccessStatus($this->getUser(), $owner)) {
				$status = $manager->getRepository("TwakeStatusBundle:Status")->findBy(Array($ownerField => $owner), Array("date" => "desc"), $limit, $offset);
			}
			else {
				$status = $manager->getRepository("TwakeStatusBundle:Status")->findBy(Array($ownerField => $owner, "privacy" => "P"), Array("date" => "desc"), $limit, $offset);
			}

			if (count($status) > 0) {
				$data["ownerDetails"] = $status[0]->getOwnerDetails();

				foreach ($status as $singleStatus) {
					$data["data"][] = $singleStatus->getAsArray($manager, $this->getUser(), $this->get("app.status")->canAccessStatus($this->getUser(), $singleStatus->getOwner()));
				}
			}
		}

		return new JsonResponse($data);
	}

	public function getContactsLikesAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$statusId = $request->request->has("statusId") ? $request->request->get("statusId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$status = $manager->getRepository("TwakeStatusBundle:Status")->find($statusId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($status == null) {
			$data["errors"][] = "statusnotfound";
		}
		else {
			$likes = $status->getLikesEntities($manager);
			$contactsLinks = $this->getUser()->getContacts();

			foreach ($likes as $like) {
				if (in_array($like->getUser(), $contactsLinks)) {
					$data['data'][] = $like->getUser()->getAsArray();
				}
			}
		}

		return new JsonResponse($data);
	}

	public function getRecapAction(Request $request)
	{
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$manager = $this->getDoctrine()->getManager();
		$limit = $request->request->has("limit") ? $request->request->get("limit") : 0;
		$offset = $request->request->has("offset") ? $request->request->get("offset") : 0;

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else {
			$users = $this->getUser()->getContacts();
			$users[] = $this->getUser();
			$groupsLinks = $manager->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("User" => $this->getUser(), "status" => "A"));

			$groups = Array();
			foreach ($groupsLinks as $groupLink) {
				$groups[] = $groupLink->getGroup();
			}

			$subscriptions = $this->getUser()->getSubscriptions();

			if(!is_array($groups)){
				$groups = Array();
			}
			if(!is_array($subscriptions)){
				$subscriptions = Array();
			}

			$status = $manager->createQueryBuilder()
				->select('s')
				->from('TwakeStatusBundle:Status', 's')
				->where('(s.workspace IN (:groups))')
				->orWhere('(s.workspace IN (:sub) AND s.privacy = :p)')
				->orWhere('s.user IN (:users)')
				->setParameter('groups', array_values($groups))
				->setParameter('users', array_values($users))
				->setParameter('sub', array_values($subscriptions))
				->setParameter('p',"P")
				->setMaxResults($limit)
				->setFirstResult($offset)
				->orderBy('s.date', 'DESC')
				->getQuery()
				->getResult();

			foreach ($status as $singleStatus) {
				$data["data"][] = $singleStatus->getAsArray($manager, $this->getUser(), $this->get("app.status")->canAccessStatus($this->getUser(), $singleStatus->getOwner()), true);
			}
		}

		return new JsonResponse($data);
	}
}
