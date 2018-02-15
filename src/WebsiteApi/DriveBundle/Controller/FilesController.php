<?php

namespace WebsiteApi\DriveBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class FilesController extends Controller
{

    public function createAction(Request $request)
    {

	    $data = Array(
		    "errors" => Array(),
		    "data" => Array()
	    );

	    $groupId = $request->request->get("groupId", 0);
	    $parentId = $request->request->get("parentId", 0);
	    $filename = $request->request->get("name", "New");
	    $content = $request->request->get("content", "");
	    $isDirectory = $request->request->get("isDirectory", true);

	    $data["errors"] = $this->get('app.workspace_levels')->errorsAccess($this->getUser(), $groupId, "Drive:general:edit");

	    if (count($data["errors"]) == 0) {

		    if (!$this->get('app.drive.FileSystem')->canAccessTo($parentId, $groupId, $this->getUser())) {
			    $data["errors"][] = "notallowed";
		    } else {

			    $file = $this->get('app.drive.FileSystem')->create($groupId, $parentId, $filename, $content, $isDirectory);
			    if (!$file) {
				    $data["errors"][] = "unknown";
			    } else {
				    $data["data"]["fileId"] = $file->getId();
			    }
		    }
	    }

	    return new JsonResponse($data);

    }

	public function deleteAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);
		$fileIds = $request->request->get("fileIds", Array());

		$can = $this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:edit");

		if ($can) {
			foreach ($fileIds as $fileId){
				$this->get('app.drive.FileSystem')->autoDelete($fileId);
			}
		}

		return new JsonResponse($data);
	}

	public function emptyTrashAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);

		$can = $this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:edit");

		if ($can) {
			if (!$this->get('app.drive.FileSystem')->emptyTrash($groupId)) {
				$data["errors"][] = "unknown";
			}
		}

		return new JsonResponse($data);
	}

	public function restoreTrashAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);
		$fileIds = $request->request->get("fileIds", null);

		$can = $this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:edit");

		if ($can) {

			if ($fileIds != null) {
				foreach ($fileIds as $fileId){
					$this->get('app.drive.FileSystem')->restore($fileId);
				}
			} else {
				$this->get('app.drive.FileSystem')->restoreTrash($groupId);
			}
		}

		return new JsonResponse($data);

	}

	public function getDetailsAction(Request $request)
	{
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);
		$objectId = $request->request->get("id", 0);

		$can = $this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:view");

		if ($can) {

			$data = $this->get('app.drive.FileSystem')->getInfos($objectId);
			$data["data"] = $data;

		}

		return new JsonResponse($data);
	}

	public function listAction(Request $request)
	{
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);
		$parentId = $request->request->get("parentId", 0);
		$state = $request->request->get("state", "");
		$offset = $request->request->get("offset", 0);
		$max = $request->request->get("max", 50);

		$isInTrash = false;
		if($state == "deleted"){
			$isInTrash = true;
		}

		if ($this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:edit")) {

			if($state == "new") {

				$files = $this->get('app.drive.FileSystem')->listNew($groupId, $offset, $max);

			} else if($state == "shared") {

				$files = $this->get('app.drive.FileSystem')->listShared($groupId, $offset, $max);

			} else if($state == "search") {

				$query = $request->request->get("query", "");
				$files = $this->get('app.drive.FileSystem')->search($groupId, $query, $offset, $max);

			} else {

				$arbo = [];
				$parent = $this->get('app.drive.FileSystem')->getObject($parentId);
				while ($parent != null) {
					$arbo[] = Array("id" => $parent->getId(), "name" => $parent->getName());
					$parent = $parent->getParent();
				}
				$data["data"]["tree"] = array_reverse($arbo);

				if ($isInTrash && $parentId == 0) {
					$files = $this->get('app.drive.FileSystem')->listTrash($groupId, $parentId);
				} else {
					$files = $this->get('app.drive.FileSystem')->listDirectory($groupId, $parentId);
				}

			}

			foreach ($files as $file) {

				$data["data"]["files"][] = $this->get('app.drive.FileSystem')->getInfos($file);

			}

			$data["data"]["maxspace"] = $this->get('app.drive.FileSystem')->getTotalSpace($groupId);
			$data["data"]["totalsize"] = $data["data"]["maxspace"] - $this->get('app.drive.FileSystem')->getFreeSpace($groupId);


		}

		return new JsonResponse($data);
	}

	public function uploadAction(Request $request)
	{
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;
		$parentId = $request->request->has("parentId") ? $request->request->get("parentId") : 0;
		$file = $_FILES["file"];

		if ($this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:edit")) {

			$file = $this->get('app.drive.FileSystem')->upload($groupId, $parentId, $file, $this->get("app.upload"));

			if ($file) {
				$data["data"]["idFile"] = $file->getId();
			} else {
				$data["errors"][] = "unknown";
			}

		}

		return new JsonResponse($data);
	}

	// TODO
	public function downloadAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		if ($request->query->has("groupId")) {
			$groupId = $request->query->get("groupId", 0);
			$fileId = $request->query->get("fileId", 0);
			$download = $request->query->get("download", 1);
		}
		else {
			$groupId = $request->request->get("groupId", 0);
			$fileId = $request->request->get("fileId", 0);
			$download = $request->request->get("download", 1);
		}

		$can = $this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:read");

		if ($can) {

			$this->get('app.drive.FileSystem')->download($groupId, $fileId, $download);

		}

		return new JsonResponse($data);
	}

	public function moveAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);
		$fileId = $request->request->get("fileToMoveId", 0);
		$fileIds = $request->request->get("fileToMoveIds", 0);
		$newParentId = $request->request->get("newParentId", 0);

		$data["errors"] = $this->get('app.workspace_levels')->errorsAccess($this->getUser(), $groupId, "Drive:general:edit");

		if (count($data["errors"]) == 0) {

			if (!$this->get('app.drive.FileSystem')->canAccessTo($fileId, $groupId, $this->getUser())) {
				$data["errors"][] = "notallowed";
			} else {

				$toMove = Array();
				if($fileId != 0){
					$toMove[] = $fileId;
				}
				if(is_array($fileIds)){
					$toMove = $fileIds;
				}

				foreach ($toMove as $id){
					$this->get('app.drive.FileSystem')->move(intval($id), $newParentId);
				}

			}
		}

		return new JsonResponse($data);

	}

	public function copyAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);
		$fileId = $request->request->get("fileToCopyId", 0);
		$newParentId = $request->request->get("newParentId", 0);

		$data["errors"] = $this->get('app.workspace_levels')->errorsAccess($this->getUser(), $groupId, "Drive:general:edit");

		if (count($data["errors"]) == 0) {
			if (!$this->get('app.drive.FileSystem')->canAccessTo($fileId, $groupId, $this->getUser())) {
				$data["errors"][] = "notallowed";
			} else if (!$this->get('app.drive.FileSystem')->copy($fileId, $newParentId)) {
				$data["errors"][] = "unknown";
			}
		}

		return new JsonResponse($data);
	}

	public function renameAction(Request $request)
	{
		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->get("groupId", 0);
		$fileId = $request->request->get("fileId", 0);
		$filename = $request->request->get("name", "");
		$description = $request->request->get("description", "");
		$labels = $request->request->get("labels", Array());

		if ($this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "Drive:general:edit")) {
			if ($filename == "") {
				$data["errors"][] = "emptyname";
			} else if (!$this->get('app.drive.FileSystem')->canAccessTo($fileId, $groupId, $this->getUser())){
				$data["errors"][] = "notallowed";
			} else if (!$this->get('app.drive.FileSystem')->rename($fileId, $filename, $description, $labels)) {
				$data["errors"][] = "unknown";
			}
		}

		return new JsonResponse($data);
	}

	public function previewAction(Request $request){

		$groupId = $request->query->get("groupId", 0);
		$fileId = $request->query->get("fileId", 0);

		if ($this->get('app.workspace_levels')->can($groupId,$this->getUser()->getId(), "Drive:general:edit")) {

			$data = $this->get('app.drive.FileSystem')->getRawContent($fileId);
			return new Response($data, 200);

		}

		return new Response(json_encode("not found"), 404);

	}

}
