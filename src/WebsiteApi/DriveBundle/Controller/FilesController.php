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

    public function chooseFileSystemService()
    {
        $aws = $this->getParameter('aws');
        if (isset($aws["S3"]["use"]) && $aws["S3"]["use"]) {
            return $this->get('app.drive.AWS_FileSystem');
        }
        return $this->get('app.drive.FileSystem');
    }
    
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
        $model = $request->request->get("model", null);
        $isDetached = $request->request->get("isDetached", false);
        $isDirectory = $request->request->get("isDirectory", true);
        $url = $request->request->get("url",null);
        $appId = $request->request->get("appId",null);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }
        $data["errors"] = $this->get('app.workspace_levels')->errorsAccess($this->getUser(), $groupId, "drive:write");

        if (count($data["errors"]) == 0) {

            if (!$fileSystem->canAccessTo($parentId, $groupId, $this->getUser())) {
                $data["errors"] = "notallowed";
            } else {

                $file = $fileSystem->create($groupId, $parentId, $filename, $content, $isDirectory, $isDetached,$url, $this->getUser()->getId(),$appId);

                if($model){
                    //IMPORTANT ! Disable local files !!!
                    if (strpos($model, "http://") !== false) {
                        $model = "http://" . str_replace("http://", "", $model);
                    } else {
                        $model = "https://" . str_replace("https://", "", $model);
                    }
                    $content = file_get_contents($model);
                    $this->get("app.drive.FileSystem")->setRawContent($file->getId(), $content);

                }

                if (!$file) {
                    $data["errors"][] = "unknown";
                } else {
                    $data["data"]["fileId"] = $file->getId();
                }
            }
        }

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

        $fileSystem = $this->chooseFileSystemService();

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

    public function deleteAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("groupId", 0);
        $fileIds = $request->request->get("fileIds", Array());
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }

        error_log("DELETE 1");

        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write");
        if ($can) {

            error_log("DELETE 2");
            foreach ($fileIds as $fileId){

                error_log("DELETE 3");
                $res = $fileSystem->autoDelete($groupId, $fileId, $this->getUser());


                error_log("DELETE 4" . json_encode($res));
            }
        }else{
            $data["errors"][] = "notallowed";
        }

        return new JsonResponse($data);
    }

    public function emptyTrashAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        $groupId = $request->request->get("groupId", 0);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write");

        if ($can) {
            if (!$fileSystem->emptyTrash($groupId)) {
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
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write");

        if ($can) {

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

        if($objectId>0) {

            $fileSystem = $this->chooseFileSystemService();

            if ($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
                $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
                $fileSystem->setRootDirectory($directory);
            }

            $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:read") || $fileSystem->verifyPublicAccess($objectId, $public_access_key);


            if ($can) {
                $data["data"] = $fileSystem->getInfos($groupId, $objectId, true);
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
        $state = $request->request->get("state", "");
        $offset = $request->request->get("offset", 0);
        $max = $request->request->get("max", 50);
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $public_access_key = $request->request->get("public_access_key", false);

        $fileSystem = $this->chooseFileSystemService();

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
                $label_id = intval($label_id[1]);

                $files = $fileSystem->byLabel($groupId, $label_id, $offset, $max);

            } else {

                $genArbo = true;

                if ($isInTrash && $parentId == 0) {
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

        $fileSystem = $this->chooseFileSystemService();

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

        $fileSystem = $this->chooseFileSystemService();

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
        $appId = $request->request->get("appId",null);
        if($newVersion=="false")
            $newVersion = false;
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }

        $file = $_FILES["file"];

        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:write")) {

            if($newVersion)
                $file = $fileSystem->uploadNewVersion($groupId, $parentId, $file, $this->get("app.upload"), $isDetached, $this->getUser()->getId(), $newVersion);
            else
                $file = $fileSystem->upload($groupId, $parentId, $file, $this->get("app.upload"), $isDetached, $this->getUser()->getId(),$appId);

            if ($file) {
                $data["data"] = $file->getAsArray();
            } else {
                $data["errors"][] = "unknown";
            }

        }

        return new JsonResponse($data);
    }


    public function downloadAction(Request $request)
    {
        $data = Array(
            "errors" => Array()
        );

        if ($request->query->has("groupId")) {
            $groupId = $request->query->get("groupId", 0);
            $fileId = $request->query->get("fileId", 0);
            $download = $request->query->get("download", 1);
            $directory = $request->query->get("directory", false);
            $versionId = $request->query->get("versionId", 0);
            $public_access_key = $request->query->get("public_access_key", false);
        }
        else {
            $groupId = $request->request->get("groupId", 0);
            $fileId = $request->request->get("fileId", 0);
            $download = $request->request->get("download", 1);
            $directory = $request->request->get("directory", false);
            $versionId = $request->request->get("versionId", 0);
            $public_access_key = $request->query->get("public_access_key", false);
        }
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }

        $can = $this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:read") || $fileSystem->verifyPublicAccess($fileId, $public_access_key);

        if ($can) {

            return $fileSystem->download($groupId, $fileId, $download, $versionId);

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
        $directory = $request->request->get("directory", false);
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        $data["errors"] = $this->get('app.workspace_levels')->errorsAccess($this->getUser(), $groupId, "drive:write");

        if (count($data["errors"]) == 0) {

            if (!$fileSystem->canAccessTo($fileId, $groupId, $this->getUser())) {
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
                    $res = $fileSystem->move($id, $newParentId,$groupId, $this->getUser()->getId());
                    if(!$res){
                        $data["errors"][] = "ヾ(⌐■_■)ノ Nice try ヾ(⌐■_■)ノ";
                    }
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

        $fileSystem = $this->chooseFileSystemService();

        if ($public_access_key == "generate") {
            $public_access_key = bin2hex(random_bytes(128));
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

        $fileSystem = $this->chooseFileSystemService();

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

        $groupId = $request->query->get("groupId", 0);
        $fileId = $request->query->get("fileId", 0);
        $original = $request->query->get("original", 0);
        $directory = $request->query->get("directory", false);
        $public_access_key = $request->query->get("public_access_key", false);
        $externalDrive = $directory;

        $fileSystem = $this->chooseFileSystemService();

        if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
            $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
            $fileSystem->setRootDirectory($directory);
        }


        if ($this->get('app.workspace_levels')->can($groupId, $this->getUser(), "drive:read") || $fileSystem->verifyPublicAccess($fileId, $public_access_key)) {

            if ($original && !$externalDrive) {
                $data = $fileSystem->getRawContent($groupId,$fileId);
            } else {
                $data = $fileSystem->getPreview($groupId,$fileId);
            }
            if($data)
                return new Response($data, 200);

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

        $fileSystem = $this->chooseFileSystemService();

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

        $fileSystem = $this->chooseFileSystemService();

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

        $fileSystem = $this->chooseFileSystemService();

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

        $fileSystem = $this->chooseFileSystemService();

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

            $fileSystem = $this->chooseFileSystemService();

            if($externalDrive && $this->get('app.drive.ExternalDriveSystem')->isAValideRootDirectory($directory)) {
                $fileSystem = $this->get('app.drive.FileSystemExternalDrive');
                $fileSystem->setRootDirectory($directory);
            }


            if ($this->get('app.workspace_levels')->can($workspace_id, $this->getUser()->getId(), "")) {

                $list = $fileSystem->getFilesFromApp($app, $workspace_id);

                $response = Array();
                foreach ($list as $element) {
                    $infos = $this->get("app.drive.FileSystem")->getInfos($workspace_id, $element, false);
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

        $res = $this->chooseFileSystemService()->changeDefaultWebApp($fileId, $app);

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
