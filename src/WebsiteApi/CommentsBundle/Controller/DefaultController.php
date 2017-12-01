<?php

namespace WebsiteApi\CommentsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\CommentsBundle\Entity\Comment;
use WebsiteApi\CommentsBundle\Entity\Like;
use WebsiteApi\OrganizationsBundle\Entity\Orga;

class DefaultController extends Controller
{
    public function createAction(Request $request)
    {
	    $data = Array(
		    "errors" => Array()
	    );

	    $groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;
	    $statusId = $request->request->has("statusId") ? $request->request->get("statusId") : 0;
	    $content = $request->request->has("content") ? $request->request->get("content") : "";
	    $tempFile = isset($_FILES["file"]) ? $_FILES["file"] : null;

	    $manager = $this->getDoctrine()->getManager();
    $group = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));
	    $status = $manager->getRepository("TwakeStatusBundle:Status")->find($statusId);
	    $canAccessStatus = $this->get('app.status')->canAccessStatus($this->getUser(), $status->getOwner());

	    if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
		    $data["errors"][] = "notconnected";
	    }
	    else if ($groupId != 0 && $group == null) {
		    $data["errors"][] = "groupnotfound";
	    }
	    else if ($status == null) {
		    $data["errors"][] = "statusnotfound";
	    }
	    else if ($content == "") {
		    $data["errors"][] = "emptycontent";
	    }
	    else if (!$canAccessStatus && $status->getPrivacy() == 'I') {
		    $data["errors"][] = "notallowedview";
	    } else if ($groupId != 0 && !$this->get('app.groups.access')->hasRight($this->getUser(), $group, "base:status:post")) {
		    $data["errors"][] = "notallowed";
	    }
	    else {
		    $tempFileId = 0;

		    if ($tempFile != null) {

			    $uploadResult = $this->get("app.uploader")->uploadFiles($groupId == 0 ? $this->getUser() : $group, $tempFile, "status");

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
		    $comment = new Comment($groupId == 0 ? $this->getUser() : $group, $content, $status, $file);
		    $status->addComment();
		    $manager->persist($comment);
		    $manager->persist($status);
		    $manager->flush();
	    }

	    return new JsonResponse($data);
    }

    public function getAction(Request $request) {

	    $data = Array(
		    "data" => Array(),
		    "errors" => Array()
	    );

	    $messageId = $request->request->has("messageId") ? $request->request->get("messageId") : 0;
	    $messageIsComment = $request->request->has("messageIsComment") ? $request->request->get("messageIsComment") : false;
	    $limit = $request->request->has("limit") ? $request->request->get("limit") : 0;
	    $offset = $request->request->has("offset") ? $request->request->get("offset") : 0;

	    $manager = $this->getDoctrine()->getManager();

	    if (!$messageIsComment) {
		    $message = $manager->getRepository("TwakeStatusBundle:Status")->find($messageId);
	    }
	    else {
		    $message = $manager->getRepository("TwakeCommentsBundle:Comment")->find($messageId);
	    }

	    if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
		    $data["errors"][] = "notconnected";
	    }
	    else if ($message == null) {
		    $data["errors"][] = "messagenotfound";
	    }
	    else if (!$messageIsComment && !$this->get('app.status')->canAccessStatus($this->getUser(), $message->getOwner()) && $message->getPrivacy() == 'I') {
		    $data["errors"][] = "notallowed";
	    }
	    else {

	    	$comments = $message->getCommentsEntities($manager, $limit, $offset);

	    	foreach ($comments as $comment) {
				$data["data"][] = $comment->getArray($manager, $this->getUser(), $limit);
		    }
	    }

	    return new JsonResponse($data);
    }


	public function editAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$commentId = $request->request->has("commentId") ? $request->request->get("commentId") : 0;
		$content = $request->request->has("content") ? $request->request->get("content") : "";

		$manager = $this->getDoctrine()->getManager();
		$comment = $manager->getRepository("TwakeCommentsBundle:Comment")->find($commentId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($comment == null) {
			$data["errors"][] = "commentnotfound";
		}
		else if ($content == "") {
			$data["errors"][] = "emptycontent";
		} else if ($comment->getOrganization() != null && !$this->get('app.groups.access')->hasRight($this->getUser(), $comment->getOrganization(), "base:status:post")) {
			$data["errors"][] = "notallowed";
		}
		else {
			$comment->setContent($content);
			$manager->persist($comment);
			$manager->flush();
		}

		return new JsonResponse($data);
	}

	public function deleteAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$commentId = $request->request->has("commentId") ? $request->request->get("commentId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$comment = $manager->getRepository("TwakeCommentsBundle:Comment")->find($commentId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($comment == null) {
			$data["errors"][] = "commentnotfound";
		} else if ($comment->getOrganization() != null && !$this->get('app.groups.access')->hasRight($this->getUser(), $comment->getOrganization(), "base:status:post")) {
			$data["errors"][] = "notallowed";
		}
		else if ($comment->getOrganization() == null && $this->getUser() != $comment->getUser()) {
			$data["errors"][] = "notallowed";
		}
		else {
			$status = $comment->getCommentedEntity($manager);
			$status->removeComment();
			$manager->persist($status);

			$likes = $comment->getLikesEntities($manager);
			foreach ($likes as $like) {
				$manager->remove($like);
			}

			$comments = $status->getCommentsEntities($manager);
			foreach ($comments as $comment) {
				$manager->remove($comment);
			}

			$manager->remove($comment);
			$manager->flush();
		}

		return new JsonResponse($data);
	}

	public function commentAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;
		$commentId = $request->request->has("commentId") ? $request->request->get("commentId") : 0;
		$content = $request->request->has("content") ? $request->request->get("content") : "";
		$tempFile = isset($_FILES["file"]) ? $_FILES["file"] : null;

		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));
		$comment = $manager->getRepository("TwakeCommentsBundle:Comment")->find($commentId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($groupId != 0 && $group == null) {
			$data["errors"][] = "groupnotfound";
		}
		else if ($comment == null) {
			$data["errors"][] = "commentnotfound";
		}
		else if ($content == "") {
			$data["errors"][] = "emptycontent";
		} else if ($groupId != 0 && !$this->get('app.groups.access')->hasRight($this->getUser(), $group, "base:status:post")) {
			$data["errors"][] = "notallowed";
		}
		else {
			$tempFileId = 0;

			if ($tempFile != null) {

				$uploadResult = $this->get("app.uploader")->uploadFiles($groupId == 0 ? $this->getUser() : $group, $tempFile, "status");

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
			$newComment = new Comment($groupId == 0 ? $this->getUser() : $group, $content, $comment, $file);
			$comment->addComment();
			$manager->persist($newComment);
			$manager->persist($comment);
			$manager->flush();
		}

		return new JsonResponse($data);
	}

	public function likeAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$commentId = $request->request->has("commentId") ? $request->request->get("commentId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$comment = $manager->getRepository("TwakeCommentsBundle:Comment")->find($commentId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($comment == null) {
			$data["errors"][] = "commentnotfound";
		}
		else {

			$like = $comment->getLikeEntity($manager, $this->getUser());

			if ($like != null) {
				$comment->removeLike();
				$manager->remove($like);
				$manager->persist($comment);
				$manager->flush();
			}
			else {
				$like = new Like($this->getUser(), $comment);
				$comment->addLike();
				$manager->persist($like);
				$manager->persist($comment);
				$manager->flush();
			}
		}

		return new JsonResponse($data);
	}
}
