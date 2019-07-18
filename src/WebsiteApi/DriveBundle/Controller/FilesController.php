<?php

namespace WebsiteApi\DriveBundle\Controller;

use PHPUnit\Util\Json;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class FilesController extends Controller
{

    public function sendAsMessageAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $application = $this->get("app.applications")->findBySimpleName("twake_drive", true);

        $object = $request->request->get("message", null);
        $chan_id = $object["channel_id"];

        $object = $this->get("app.messages")->save($object, Array(), $this->getUser(), $application);

        $event = Array(
            "client_id" => "bot",
            "action" => "save",
            "object_type" => "",
            "object" => $object
        );
        $this->get("app.websockets")->push("messages/" . $chan_id, $event);

        $data["data"] = $object;

        return new JsonResponse($data);
    }

    public function moveDetachedFileToDriveAction(Request $request){
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $groupId = $request->request->get("groupId", 0);
        $detachedFileId = $request->request->get("detachedFileId", 0);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }

        $data["errors"] = $this->get('app.workspace_levels')->errorsAccess($this->getUser(), $groupId, "drive:write");

        if (count($data["errors"]) == 0) {
            $file = $fileSystem->moveDetachedFileToDrive($groupId, $detachedFileId, $directory, $userId = 0);

            if (!$file) {
                $data["errors"][] = "unknown";
            } else {
                $data["data"] = $file->getAsArray();
            }
        }
        return new JsonResponse($data);
    }

    //Tested and ready for 1.2 !
    public function deleteAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("workspace_id", 0);
        $fileIds = $request->request->get("elements_id", Array());

        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write");
        if ($can || true) {
            $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();
            foreach ($fileIds as $fileId){
                $res = $fileSystem->autoDelete($groupId, $fileId, $this->getUser());
            }
        }else{
            $data["errors"][] = "notallowed";
        }

        return new JsonResponse($data);
    }

    //Tested and ready for 1.2 !
    public function restoreTrashAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("workspace_id", 0);
        $fileIds = $request->request->get("elements_id", Array());

        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write");

        if ($can || true) {
            $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

            if ($fileIds != null) {
                foreach ($fileIds as $fileId){
                    $fileSystem->restore($fileId);
                }
            } else {
                $fileSystem->restoreTrash($groupId);
            }
        }

        return new JsonResponse($data);

    }

    //Tested and ready for 1.2 !
    public function emptyTrashAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("workspace_id", 0);

        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write");

        if ($can || true) {
            $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();
            if (!$fileSystem->emptyTrash($groupId)) {
                $data["errors"][] = "unknown";
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
        $directory = $request->request->get("directory", false);
        $public_access_key = $request->request->get("public_access_key", false);
        $externalDrive = $directory;

        if ((is_int($objectId) && $objectId > 0) || (is_string($objectId) && strlen($objectId) > 10)) {

            $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

            if ($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
                $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
                $fileSystem->setRootDirectory($directory);
            }

            $data["data"] = $fileSystem->getInfos($groupId, $objectId, true);

            if (isset($data["data"]["id"])) {

                $can = true;
                if (!$data["data"]["detached"]) {
                    $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:read") || $fileSystem->verifyPublicAccess($objectId, $public_access_key);
                }

                if (!$can) {
                    $data["data"] = [];
                }

            }

            if (!$externalDrive)
                $haveReadAccess = $this->get('app.workspace_levels')->can(
                        $fileSystem->getWorkspace($objectId),
                        $this->getUser(), "drive:read")
                    || $fileSystem->verifyPublicAccess($objectId, $public_access_key);
            else
                $haveReadAccess = true;

            if (!$data["data"] && $haveReadAccess) {
                $data["data"] = $fileSystem->getInfos(
                    $fileSystem->getWorkspace($objectId),
                    $objectId, true);
            }

            $data["data"]["drive"] = $directory;

        }

        return new JsonResponse($data);
    }

    public function listAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $genArbo = false;
        $groupId = $request->request->get("groupId", 0);
        $parentId = $request->request->get("parentId", 0);
        if ($parentId == "undefined") {
            $parentId = 0;
        }
        $state = $request->request->get("state", "");
        $offset = $request->request->get("offset", 0);
        $max = $request->request->get("max", 50);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $public_access_key = $request->request->get("public_access_key", false);

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        $isInTrash = false;
        if($state == "deleted"){
            $isInTrash = true;
        }

        if (strlen($public_access_key) > 20) {

            $access_allowed = false;
            $arbo = [];
            $initialParentObject = $fileSystem->getObject($parentId);
            $parent = $initialParentObject;
            while ($parent != null) {
                $arbo[] = Array("id" => $parent->getId(), "name" => $parent->getName(), "shared" => $parent->getShared());

                if ($parent->getPublicAccessKey() == $public_access_key) {
                    $access_allowed = true;
                    $parent = null;
                } else {
                    $parent = $parent->getParent();
                }
            }

            if ($access_allowed) {
                $data["data"]["tree"] = array_reverse($arbo);

                if ($initialParentObject->getIsDirectory()) {
                    $files = $fileSystem->listDirectory($groupId, $parentId);
                } else {
                    $files = [$initialParentObject];
                }

                if (count($files) != 0 && $files == false) {
                    $data["data"]["error"] = "notauthorized";
                } else {
                    foreach ($files as $index => $file) {
                        if ($file->getCopyOf() == null) {//if it's a copy shortcut to another folder, link directly the folder
                            $data["data"]["files"][] = $fileSystem->getInfos($groupId, $file, true);
                            $data["data"]["files"][$index]["shortcut"] = false;
                        }
                    }
                }

                $data["data"]["maxspace"] = $fileSystem->getTotalSpace($groupId);
                $data["data"]["totalsize"] = $fileSystem->getUsedSpace($groupId);

            } else {
                $data["data"]["error"] = "notauthorized";
            }

        } else if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:read")) {

            if($state == "new") {

                $files = $fileSystem->listNew($groupId, $offset, $max);

            } else if ($state == "shared") {

                if ($parentId != 0){
                    $files = $fileSystem->listDirectory($groupId, $parentId);
                }else{
                    $files = $fileSystem->listShared($groupId);
                }
                $genArbo = true;

            } else if ($state == "search") {

                $query = $request->request->get("query", "");
                $files = $fileSystem->search($groupId, $query, $offset, $max);

            } else if (strpos($state, "label_") === 0) {

                $label_id = explode("_", $state);
                $label_id = $label_id[1];

                $files = $fileSystem->byLabel($groupId, $label_id, $offset, $max);

            } else {

                $genArbo = true;

                if ($isInTrash && $parentId . "" == "0") {
                    $files = $fileSystem->listTrash($groupId, $parentId);
                } else {
                    $files = $fileSystem->listDirectory($groupId, $parentId);
                }

            }

            if ($genArbo){
                $arbo = [];
                $parent = $fileSystem->getObject($parentId);
                while ($parent != null) {
                    $arbo[] = Array("id" => $parent->getId(), "name" => $parent->getName(), "shared" => $parent->getShared());
                    $parent = $parent->getParent();
                }
                $data["data"]["tree"] = array_reverse($arbo);
            }

            if(count($files) != 0 && $files == false){
                $data["data"]["error"] = "notauthorized";
            }else{
                foreach ($files as $index => $file) {

                    if ($file->getCopyOf() != null){//if it's a copy shortcut to another folder, link directly the folder
                        $data["data"]["files"][] = $fileSystem->getInfos($groupId,$file->getCopyOf(),true);
                        $data["data"]["files"][$index]["shortcut"] = true;
                    }else{
                        $data["data"]["files"][] = $fileSystem->getInfos($groupId,$file,true);
                        $data["data"]["files"][$index]["shortcut"] = false;
                    }

                }
            }

            $data["data"]["maxspace"] = $fileSystem->getTotalSpace($groupId);
            $data["data"]["totalsize"] = $fileSystem->getUsedSpace($groupId);


        }

        if(isset($data["data"]["files"])) {
            for ($i = 0; $i < count($data["data"]["files"]); $i++)
                $data["data"]["files"][$i]["drive"] = $directory;
        }

        return new JsonResponse($data);
    }

    public function listLastUsedAction(Request $request){

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $groupId = $request->request->get("groupId", 0);
        $offset = $request->request->get("offset", 0);
        $max = $request->request->get("max", 50);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:read")) {


            $files = $fileSystem->listLastUsed($groupId, $offset, $max);


            if(count($files) != 0 && $files == false){
                $data["data"]["error"] = "notauthorized";
            }else{
                foreach ($files as $index => $file) {

                    if (!$file->getIsDirectory()) {
                        if ($file->getCopyOf() != null) {//if it's a copy shortcut to another folder, link directly the folder
                            $add = $fileSystem->getInfos($groupId, $file->getCopyOf(), true);
                            $add["shortcut"] = true;
                        } else {
                            $add = $fileSystem->getInfos($groupId, $file, true);
                            $add["shortcut"] = false;
                        }
                        $data["data"]["files"][] = $add;
                    }

                }
            }

            $data["data"]["maxspace"] = $fileSystem->getTotalSpace($groupId);
            $data["data"]["totalsize"] = $fileSystem->getUsedSpace($groupId);

        }

        if(isset($data["data"]["files"])) {
            for ($i = 0; $i < count($data["data"]["files"]); $i++)
                $data["data"]["files"][$i]["drive"] = $directory;
        }

        return new JsonResponse($data);
    }

    public function getDriveFileVersionsAction(Request $request){

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $fileId = $request->request->get("fileId", 0);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }

        $objectsData = $fileSystem->getDriveFileVersions($fileId);

        foreach ($objectsData as $object){
            $data["data"][] = $object->getAsArray();
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
        $isDetached = $request->request->getBoolean("isDetached", false);
        $directory = $request->request->get("directory", false);
        $newVersion = $request->request->get("newVersion", 0);
        $appid = $request->request->get("appid", null);
        if($newVersion=="false")
            $newVersion = false;
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }

        $file = $_FILES["file"];

        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write")) {

            if($newVersion)
                $file = $fileSystem->uploadNewVersion($groupId, $parentId, $file, $this->get("app.upload"), $isDetached, $this->getUser()->getId(), $newVersion);
            else
                $file = $fileSystem->upload($groupId, $parentId, $file, $this->get("app.upload"), $isDetached, $this->getUser()->getId(), $appid);

            if ($file) {
                $data["data"] = $file->getAsArray();
            } else {
                $data["errors"][] = "unknown";
            }

        }

        return new JsonResponse($data);
    }

    //Tested and ready for 1.2 !
    public function downloadAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        if ($request->query->has("workspace_id")) {
            $data = $request->query;
        } else {
            $data = $request->request;
        }

        $workspace_id = $data->get("workspace_id", 0);
        $files_ids = $data->get("element_id", 0);
        $download = $data->get("download", 1);
        $versionId = $data->get("version_id", 0);
        $public_access_key = $data->get("public_access_key", false);

        if ($data->has("elements_id")) {
            $files_ids = explode(",", $data->get("elements_id", ""));
        }

        //TODO check access to this file or set of files


        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();
        @$response = $this->get('driveupload.download')->download($workspace_id, $files_ids, $download, $versionId, $fileSystem);
        if ($response === true) {
            return;
        }

        return new JsonResponse($data);

    }

    public function moveAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("workspace_id", 0);
        $fileIds = $request->request->get("elements_id", []);
        $newParentId = $request->request->get("destination_id", 0);

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        $data["errors"] = $this->get('app.workspace_levels')->errorsAccess($this->getUser(), $groupId, "drive:write");

        if (count($data["errors"]) == 0 || true) {

            foreach ($fileIds as $id) {
                $res = $fileSystem->move($id, $newParentId, $groupId, $this->getUser()->getId());
                if (!$res) {
                    $data["errors"][] = "error";
                }
            }

        }

        return new JsonResponse($data);

    }

    public function updatePublicAccessKeyAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("workspace_id", 0);
        $fileId = $request->request->get("fileId", 0);
        $public_access_key = $request->request->get("public_access_key", "");

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if ($public_access_key == "generate") {
            $public_access_key = bin2hex(random_bytes(64));
        } else if ($public_access_key != "") {
            $data["errors"][] = "badparameters";
            return new JsonResponse($data);
        }

        $data["data"] = $public_access_key;

        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:manage")) {
            if (!$fileSystem->canAccessTo($fileId, $groupId, $this->getUser())) {
                $data["errors"][] = "notallowed";
            } else if (!$fileSystem->updatePublicAccessKey($fileId, $public_access_key)) {
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
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if ($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write")) {
            if ($filename == "") {
                $data["errors"][] = "emptyname";
            } else if (!$fileSystem->canAccessTo($fileId, $groupId, $this->getUser())) {
                $data["errors"][] = "notallowed";
            } else if (!$fileSystem->rename($fileId, $filename, $description, $labels, $this->getUser()->getId())) {
                $data["errors"][] = "unknown";
            }
        }

        return new JsonResponse($data);
    }

    public function previewAction(Request $request){

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        $file_version_id = $request->query->get("f", false);
        if ($file_version_id) {
            $workspace_id = $request->query->get("w", "");

            $data = $fileSystem->getPreview($workspace_id, $file_version_id);

            if ($data) {
                return new Response($data, 200);
            }
        }

        return new Response(json_encode("not found"), 404);

    }

    public function getSharedAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("groupId", 0);
        $fileId = $request->request->get("fileSearchedId", 0);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write")) {
            $files = $fileSystem->getSharedWorkspace($groupId,$fileId);
            if (count($files) != 0 && !$files ) {
                $data["errors"][] = "unknown";
            }else{
                $data["data"]["workspaces"] = Array();
                foreach ($files as $file) {
                    $data["data"]["workspaces"][] = $file->getGroup()->getAsArray();
                }
                $data["data"]["owner"] = $fileSystem->isFolderOwner($groupId,$fileId);
            }
        }else{
            $data["errors"][] = "notallowed";
        }

        return new JsonResponse($data);
    }

    public function shareAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("groupId", 0);
        $workspaceId = $request->request->get("sharedWorkspaceId", 0);
        $fileId = $request->request->get("fileToCopyId", 0);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write")) {
            if (!$fileSystem->canAccessTo($fileId, $groupId, $this->getUser())) {
                $data["errors"][] = "notallowed";
            } else if (!$fileSystem->share($groupId,$fileId,$workspaceId)) {
                $data["errors"][] = "unknown";
            }
        }else{
            $data["errors"][] = "notallowed";
        }

        return new JsonResponse($data);
    }

    public function unshareAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("groupId", 0);
        $workspaceId = $request->request->get("unshareWorkspaceId", 0);
        $fileId = $request->request->get("fileToUnshareId", 0);
        $removeAll = $request->request->get("totallyUnshare", false);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        if (!$this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write")) {
            $data["errors"][] = "notallowed";
        } else if (!$fileSystem->unshare($groupId,$fileId,$workspaceId,$removeAll)) {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);
    }

    public function openAction(Request $request){
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $file = $request->request->get("id", null);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }

        $bool = $fileSystem->open($file);

        if ($bool){
            $data["data"][] ="success";
        }else{
            $data["data"][] = "error";
        }

        return new JsonResponse($data);
    }

    public function getFilesFromAppAction(Request $request){
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        if ($this->getUser()) {

            $workspace_id = $request->request->get("workspace_id", 0);
            $app = $request->request->get("app", 0);
            $directory = $request->request->get("directory", false);
            $externalDrive = $directory;

            $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();

            if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
                $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
                $fileSystem->setRootDirectory($directory);
            }


            if ($this->get('app.workspace_levels')->can($workspace_id, $this->getUser()->getId(), "")) {

                $list = $fileSystem->getFilesFromApp($app, $workspace_id);

                $response = Array();
                foreach ($list as $element) {
                    $infos = $this->get("app.drive.adapter_selector")->getFileSystem()->getInfos($workspace_id, $element, false);
                    $response[] = $infos;
                }

                $data["data"] = $response;

            }

        }

        return new JsonResponse($data);
    }

    public function changeDefaultWebAppAction(Request $request){
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $fileId = $request->request->get("fileId", 0);
        $app = $request->request->get("app", 0);

        $res = $this->get("app.drive.adapter_selector")->getFileSystem()->changeDefaultWebApp($fileId, $app);

        if($res){
            $data["data"] = "success";
        }elseif($res==null) {
            $data["errors"][] = "error file or app not found";
        }else{
            $data["errors"][] = "error invalide file or app";
        }

        return new JsonResponse($data);
    }

}
