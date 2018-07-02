<?php


namespace WebsiteApi\DriveBundle\Services;

use Google_Service_Drive;
use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\DriveBundle\Services\MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Services\AESCryptFileLib;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileLabel;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\DriveBundle\Model\DriveFileSystemInterface;
use ZipArchive;

class DriveFileSystemGDrive
{

    var $doctrine;
    var $gdriveApi;
    var $pusher;
    var $restClient;
    var $externalDriveSystem;
    var $userToken;

    public function __construct($doctrine,GDriveApiSystem $gdriveApi, $pusher, $restClient, $externalDriveSystem)
    {
        $this->doctrine = $doctrine;
        $this->gdriveApi = $gdriveApi;
        $this->pusher = $pusher;
        $this->restClient = $restClient;
        $this->externalDriveSystem = $externalDriveSystem;
        $this->userToken = null;
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = intval($var);
        }

        if (is_int($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function setRootDirectory($directory){
        $this->userToken = $this->externalDriveSystem->getTokenFromFileId($directory);
        $this->gdriveApi->getClient($this->userToken);

    }

    public function getUsedSpace()
    {
        $data = $this->restClient->get("https://www.googleapis.com/drive/v3/about?fields=storageQuota",
            array(CURLOPT_HTTPHEADER => Array("'Content-Type: application/json'", "Authorization: Bearer " . $this->gdriveApi->getGDriveToken($this->userToken))));

        $content = @json_decode($data->getContent(), true);

        $storageQuota = $content["storageQuota"];

        return intval($storageQuota["usage"]);
        return 0;
    }

    public function getFreeSpace()
    {
        return $this->getTotalSpace() - $this->getUsedSpace();
    }

    public function getTotalSpace()
    {
        $data = $this->restClient->get("https://www.googleapis.com/drive/v3/about?fields=storageQuota",
            array(CURLOPT_HTTPHEADER => Array("'Content-Type: application/json'", "Authorization: Bearer " . $this->gdriveApi->getGDriveToken($this->userToken))));

        $content = @json_decode($data->getContent(), true);

        $storageQuota = $content["storageQuota"];

        if(isset($storageQuota["limit"]))
        return intval($storageQuota["limit"]);
        return 10000000000000000;
    }

    public function canAccessTo($file)
    {
        /*$workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");
        if ($workspace == null) {
            return false;
        }
        if ($file == null) {
            return true;
        }
        return $file->getDetachedFile() ;*/
        return true;
    }

    public function move($fileOrDirectory, $directory)
    {
        return $this->gdriveApi->move($fileOrDirectory,$directory,$this->userToken);
    }

    public function getSharedWorkspace($groupId, $fileId)
    {
        $directory = $this->convertToEntity($fileId, "TwakeDriveBundle:DriveFile");

        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $shared = $driveRepository->findBy(Array("copyOf" => $directory));

        return $shared;

    }

    public function isFolderOwner($groupId, $fileId)
    {
        $directory = $this->convertToEntity($fileId, "TwakeDriveBundle:DriveFile");

        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $res = $driveRepository->findOneBy(Array("id" => $fileId, "group" => $groupId, "copyOf" => null));

        return isset($res);

    }

    public function share($groupId, $directory, $targetgroupId)
    {

        $fileOrDirectory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");
        $group = $this->convertToEntity($targetgroupId, "TwakeWorkspacesBundle:Workspace");

        if ($fileOrDirectory == null || $fileOrDirectory->getIsDirectory() == false || $groupId == $targetgroupId) {
            return false;
        }



        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $copy = $driveRepository->findOneBy(Array("group" => $group, "copyOf" => $directory));
        if ($copy) {
            return false; //already shared
        }

        $parent = $fileOrDirectory->getParent();

        $newFile = new DriveFile(
            $group,
            $parent,
            $fileOrDirectory->getName(),
            $fileOrDirectory->getIsDirectory(),
            $fileOrDirectory
        );

        $newFile->setSize($fileOrDirectory->getSize());

        $this->improveName($newFile);

        $fileOrDirectory->setShared(true);
        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->persist($newFile);
        $this->doctrine->flush();

        $this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getGroup()->getId());
        $this->pusher->push(Array("action" => "update"), "drive/" . $newFile->getGroup()->getId());

        return true;
    }

    public function unshare($groupId, $directory, $targetgroupId, $removeAll)
    {
        $fileOrDirectory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");

        if ($fileOrDirectory == null || $fileOrDirectory->getIsDirectory() == false) {
            return false;
        }

        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");

        if ($removeAll) {
            $copies = $driveRepository->findBy(Array("copyOf" => $directory));
            foreach ($copies as $copy) {
                $this->doctrine->remove($copy);
            }
            $fileOrDirectory->setShared(false);
        } else {
            //Set unshared if last
            $copies = $driveRepository->findBy(Array("copyOf" => $directory));
            if (count($copies) == 1) {
                $fileOrDirectory->setShared(false);
            }

            $copy = $driveRepository->findOneBy(Array("group" => $targetgroupId, "copyOf" => $directory));
            if ($copy == null) {
                return false;
            }
            $this->doctrine->remove($copy);
        }
        $this->doctrine->flush();

        $this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getGroup()->getId());
        $this->pusher->push(Array("action" => "update"), "drive/" . $targetgroupId);

        return false;
    }

    public function rename($fileOrDirectory, $filename, $description)
    {

        /*//Update labels
        $labelsRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel");
        $old_labels = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileLabel")->findBy(Array("file" => $fileOrDirectory));

        foreach ($old_labels as $old_label) {
            $found = false;
            foreach ($labels as $new_label) {
                if ($old_label->getId() == $new_label["id"]) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $this->doctrine->remove($old_label);
            }
        }

        foreach ($labels as $new_label) {
            $found = false;
            foreach ($old_labels as $old_label) {
                if ($old_label->getLabel()->getId() == $new_label["id"]) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $l = $labelsRepository->find($new_label["id"]);
                if ($l) {
                    $new_label = new DriveFileLabel($fileOrDirectory, $l);
                    $this->doctrine->persist($new_label);
                }
            }
        }

        *///End update label

        $this->gdriveApi->rename($fileOrDirectory,$filename,$description, $this->userToken);


        $this->pusher->push(Array("action" => "update"), "drive/0");// . $fileOrDirectory->getGroup()->getId());

        return true;

    }

    public function create($workspace, $directoryId, $filename, $content = "", $isDirectory)
    {
        if ($directoryId == 0) {
            $directoryId = null;
        }

        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        $newFile = new DriveFile(
            $workspace,
            $directoryId,
            $filename,
            $isDirectory
        );
        $json = "{";

        if($isDirectory){
            $json .= "\"name\": \"$filename\",";
            if($directoryId!=0)
                $json .= "\"parents\" : [\"$directoryId\"],";
            $json .= "\"mimeType\": \"application/vnd.google-apps.folder\"";
        }else{
            $json .= "\"name\": \"$filename\"";
            if($directoryId!=0)
                $json .= ",\"parents\" : [\"$directoryId\"]";
        }

        $json .= "}";

        $data = $this->restClient->post('https://www.googleapis.com/drive/v3/files', $json,
            array(CURLOPT_HTTPHEADER => Array("Authorization: Bearer " . $this->gdriveApi->getGDriveToken($this->userToken), "Content-Type: application/json")));
        return $newFile;
    }

    public function getPreview($workspace, $fileid)
    {
        return $this->gdriveApi->getPreview($fileid, $this->userToken);
    }

    public function getRawContent($workspace, $file)
    {
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

        if ($file == null) {
            return false;
        }


        if ($file->getSize() > 5000000) { //5Mo (protection)
            return "";
        }

        /*$path = $this->getRoot() . $file->getPath();

        $this->verifyPath($path);

        if (!file_exists($path)) {
            return null;
        }

        return $this->readDecode($path, $file->getLastVersion()->getKey(), $file->getLastVersion()->getMode());*/
    }

    public function getInfos($workspace, $fileOrDirectory)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        return $this->gdriveApi->getInfos($workspace,$fileOrDirectory, $this->userToken);
    }

    public function getWorkspace($fileOrDirectory)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
        if (!$fileOrDirectory) {
            return null;
        }
        return $fileOrDirectory->getGroup();
    }


    public function listDirectory($workspaceId, $directory)
    {
        $workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");
        if($directory===0)
            $directory = "sharedWithMe or 'root'";//
        else{
            $directory = "'".$directory."'";
        }

        return $this->gdriveApi->listFiles($workspace,$directory, $this->userToken);
    }

    public function search($workspace, $query, $offset, $max)
    {
        if ($query == "") {
            return Array();
        }

        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if ($workspace == null) {
            return false;
        }

        return $this->gdriveApi->searchNameContains($workspace,$query,$offset,$max, $this->userToken);
    }

    public function byLabel($workspace, $label)
    {

        if ($label <= 0) {
            return Array();
        }

        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");;

        if ($workspace == null) {
            return false;
        }

        $list = Array();
        return $list;

        /** @var DriveLabel $label */
        /*$label = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel")->find($label);
        if ($label->getWorkspace()->getId() == $workspace->getId()) {
            /** @var DriveFileLabel[] $filesLabels */
            /*$filesLabels = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileLabel")->findBy(Array("label" => $label), Array(), $max, $offset);
            foreach ($filesLabels as $fileLabel) {
                $list[] = $fileLabel->getFile();
            }
        }

        return $list;*/

    }

    public function listNew($workspace, $offset, $max)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");;

        if ($workspace == null) {
            return false;
        }

        $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->search($workspace, Array(), Array("added" => "DESC"), $offset, $max);
        return $list;
    }

    public function listShared($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");;

        if ($workspace == null) {
            return false;
        }

        $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->shared($workspace);
        return $list;
    }

    public function listTrash($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");;

        if ($workspace == null) {
            return false;
        }
        $list = $this->gdriveApi->listTrash($workspace, $this->userToken);
        return $list;
    }

    public function autoDelete($workspace, $fileOrDirectory)
    {
        if ($fileOrDirectory == null) {
            return false;
        }
        $file = $this->gdriveApi->getGDriveFileFromGDriveId($fileOrDirectory, $this->userToken);
        // If already in trash force remove
        if ($file->getTrashed()) {
            return $this->delete($fileOrDirectory);
        }else {
            return $this->toTrash($fileOrDirectory);
        }

        return true;
    }

    public function toTrash($fileOrDirectory){
        $rep = $this->gdriveApi->setTrashed($fileOrDirectory, true, $this->userToken);

        return true;
    }

    public function delete($fileOrDirectory)
    {
        if ($fileOrDirectory == null) {
            return false;
        }

        $this->gdriveApi->delete($fileOrDirectory, $this->userToken);

        return true;
    }

    public function restore($fileOrDirectory)
    {
        $this->gdriveApi->setTrashed($fileOrDirectory, false, $this->userToken);

        return true;
    }

    public function emptyTrash($workspace)
    {
        if ($workspace == null) {
            return false;
        }

        if ($this->listTrash($workspace) == false) {
            return false;
        }

        $list = $this->listTrash($workspace);

        foreach ($list as $child) {
            $this->delete($child->getId());
        }
        return true;
    }

    public function restoreTrash($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if ($workspace == null) {
            return false;
        }

        if ($this->listTrash($workspace) == false) {
            return false;
        }

        $list = $this->listTrash($workspace);

        foreach ($list as $child) {
            $this->restore($child);
        }

        $this->pusher->push(Array("action" => "update"), "drive/" . $workspace->getId());

        return true;
    }

    public function getObject($fileOrDirectory)
    {
        return $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
    }

    public function upload($workspace, $directory, $file)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        $file = $this->gdriveApi->upload($file, $directory,$this->userToken);

        $newFile = $this->gdriveApi->getDriveFileFromGDriveFile($workspace, $file);

        return $newFile;

    }

    public function download($workspace, $file, $download)
    {
        $url = $this->gdriveApi->download($file);

        if($url)
            header('Location:'.$url);
    }

    public function open($file){
        return true;
    }

    public function copyFromExternalDrive($workspace, $directory, $externalDriveFileId)
    {
        //$workspace, $directory, $filename, $content = "";
        $gdriveFile = $this->gdriveApi->getGDriveFileFromGDriveId($externalDriveFileId, $this->userToken);
        $content = "";


        if($gdriveFile->getWebContentLink()!=null) {
            $service = new Google_Service_Drive($this->gdriveApi->getClient($this->userToken));

            $response = $service->files->get($externalDriveFileId, array(
                'alt' => 'media'));
            $content = $response->getBody()->getContents();
        }

        return $this->driveFileSystem->create($workspace, $directory, $gdriveFile->getName(), $content, false, false, $gdriveFile->getWebViewLink());
    }

    public function copyToExternalDrive($workspace, $directory, $file)
    {
        $this->upload($workspace,$directory,$file);
    }

    public function unwatchFile($fileId, $rootDirectory){
        $externalDrive = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDrive")->findOneBy(Array("fileId" => $rootDirectory));
        $this->gdriveApi->unwatchFile($fileId,$externalDrive->getWorkspace()->getId(),$externalDrive->getExternalToken());
    }

    public function watchFile($fileId, $rootDirectory){
        $externalDrive = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDrive")->findOneBy(Array("fileId" => $rootDirectory));
        $this->gdriveApi->watchFile($fileId,$externalDrive->getWorkspace()->getId(),$externalDrive->getExternalToken());
    }
    public function getDriveType($rootDirectory){
        if($rootDirectory){
            return "gdrive";
        }
        return "twake";
    }
}
