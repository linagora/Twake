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

class DriveFileSystemGDrive implements DriveFileSystemInterface
{

    var $doctrine;
    var $driveFileSystem;
    var $gdriveApi;
    var $pusher;
    var $restClient;

    public function __construct($doctrine, $gdriveApi, $pusher, $restClient, $driveFileSystem)
    {
        $this->doctrine = $doctrine;
        $this->gdriveApi = $gdriveApi;
        $this->pusher = $pusher;
        $this->restClient = $restClient;
        $this->driveFileSystem = $driveFileSystem;
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

    public function getUsedSpace($workspace)
    {
        $data = $this->restClient->get("https://www.googleapis.com/drive/v3/about?fields=storageQuota",
            array(CURLOPT_HTTPHEADER => Array("'Content-Type: application/json'", "Authorization: Bearer " . $this->gdriveApi->getGDriveToken())));

        $content = @json_decode($data->getContent(), true);

        $storageQuota = $content["storageQuota"];

        return intval($storageQuota["usage"]);
    }

    public function getFreeSpace($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        return $this->getTotalSpace($workspace) - $this->getUsedSpace($workspace);
    }

    public function getTotalSpace($workspace)
    {
        $data = $this->restClient->get("https://www.googleapis.com/drive/v3/about?fields=storageQuota",
            array(CURLOPT_HTTPHEADER => Array("'Content-Type: application/json'", "Authorization: Bearer " . $this->gdriveApi->getGDriveToken())));

        $content = @json_decode($data->getContent(), true);

        $storageQuota = $content["storageQuota"];

        if(isset($storageQuota["limit"]))
        return intval($storageQuota["limit"]);
        return 10000000000000000;
    }

    public function setTotalSpace($workspace, $space)
    {
        return false;
    }

    public function canAccessTo($file, $workspaceId, $user = null)
    {
        /*$workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");
        if ($workspace == null) {
            return false;
        }
        if ($file == null) {
            return true;
        }
        return $file->getDetachedFile() || $this->isWorkspaceAllowed($workspaceId, $file);*/
        return true;
    }


    // @improveName updates name of object in case a directory already exists where we want to move it

    /**
     * @param $fileOrDirectory
     */
    private function improveName($fileOrDirectory)
    {
        $originalCompleteName = explode(".", $fileOrDirectory->getName());
        $originalName = array_shift($originalCompleteName);
        $originalExt = join(".", $originalCompleteName);

        $currentNames = [];
        if ($fileOrDirectory->getParent() != null) {
            foreach ($fileOrDirectory->getParent()->getChildren() as $brothers) {
                if ($brothers->getId() != $fileOrDirectory->getId()) {
                    $currentNames[] = $brothers->getName();
                }
            }
        } else {
            foreach ($this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
                         ->listDirectory(null, $fileOrDirectory->getIsInTrash()) as $brothers) {
                if ($brothers->getId() != $fileOrDirectory->getId()) {
                    $currentNames[] = $brothers->getName();
                }
            }
        }

        $i = 2;

        //Verify there is not already a number
        $parts = explode(" ", $originalName);
        $last = array_pop($parts);
        if (intval($last) . "" == $last) {
            $i = intval($last) + 1;
            $originalName = join(" ", $parts);
        }

        while (in_array($fileOrDirectory->getName(), $currentNames)) {
            //Rename file
            $fileOrDirectory->setName($originalName . " " . $i . (($originalExt) ? "." : "") . $originalExt);
            $i++;
        }
    }

    private function updateSize($directory, $delta)
    {
        while ($directory != null) {
            $currentSize = $directory->getSize();
            $directory->setSize($currentSize + $delta);
            $this->doctrine->persist($directory);
            $directory = $directory->getParent();
        }
    }

    public function move($fileOrDirectory, $directory, $groupId = null)
    {
        return $this->gdriveApi->move($fileOrDirectory,$directory);
    }

    private function recursCopy($inFile, $outFile)
    {/*
        if (!$inFile->getIsDirectory()) {

            //Copy real file
            $from = $this->getRoot() . $inFile->getPath();
            $to = $this->getRoot() . $outFile->getPath();

            if (file_exists($from)) {
                copy($from, $to);
            } else {
                $this->delete($inFile);
                return;
            }

        } else {

            foreach ($inFile->getChildren() as $child) {

                $newFile = new DriveFile(
                    $child->getGroup(),
                    $outFile,
                    $child->getName(),
                    $child->getIsDirectory()
                );

                $newFile->setSize($child->getSize());

                $this->doctrine->persist($newFile);

                $this->recursCopy($child, $newFile);

            }
        }*/
    }

    public function copy($fileOrDirectory, $newParent = null)
    {

        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
        $newParent = $this->convertToEntity($newParent, "TwakeDriveBundle:DriveFile");

        if ($fileOrDirectory == null || $this->getFreeSpace($fileOrDirectory->getGroup()) <= 0) {
            return false;
        }

        $parent = $fileOrDirectory->getParent();
        if ($newParent != null) {
            $parent = $newParent;
        }

        $newFile = new DriveFile(
            $fileOrDirectory->getGroup(),
            $parent,
            $fileOrDirectory->getName(),
            $fileOrDirectory->getIsDirectory()
        );

        $newFile->setSize($fileOrDirectory->getSize());

        $this->improveName($newFile);

        //If file copy version (same key currently -> to improve)
        if (!$newFile->getIsDirectory()) {

            $this->doctrine->persist($newFile);
            $this->doctrine->flush();

            $newVersion = new DriveFileVersion($newFile);
            $newFile->setLastVersion($newVersion);

            $newVersion->setKey($fileOrDirectory->getLastVersion()->getKey());
            $newVersion->setSize($fileOrDirectory->getSize());
            $this->doctrine->persist($newVersion);
        }

        // Copy real file and sub files (copy entities)
        $this->recursCopy($fileOrDirectory, $newFile);

        $this->updateSize($parent, $newFile->getSize());
        $this->improveName($fileOrDirectory);

        $this->doctrine->persist($newFile);
        $this->doctrine->flush();

        return true;

    }

    public function getSharedWorkspace($groupId, $fileId)
    {
        $directory = $this->convertToEntity($fileId, "TwakeDriveBundle:DriveFile");

        if (!$this->isWorkspaceAllowed($groupId, $directory)) {
            return false;
        }

        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $shared = $driveRepository->findBy(Array("copyOf" => $directory));

        return $shared;

    }

    public function isFolderOwner($groupId, $fileId)
    {
        $directory = $this->convertToEntity($fileId, "TwakeDriveBundle:DriveFile");

        if (!$this->isWorkspaceAllowed($groupId, $directory)) {
            return false;
        }

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

        if (!$this->isWorkspaceAllowed($groupId, $directory)) {
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
        if (!$this->isWorkspaceAllowed($groupId, $directory)) {
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

    public function rename($fileOrDirectory, $filename, $description = null, $labels = Array())
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

        $this->gdriveApi->rename($fileOrDirectory,$filename,$description);

        //Flush
        //$this->doctrine->flush();

        //$this->updateLabelsCount($fileOrDirectory->getGroup());

        $this->pusher->push(Array("action" => "update"), "drive/0");// . $fileOrDirectory->getGroup()->getId());

        return true;

    }

    public function create($workspace, $directoryId, $filename, $content = "", $isDirectory = false, $detached_file = false)
    {
        if ($directoryId == 0 || $detached_file) {
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
            array(CURLOPT_HTTPHEADER => Array("Authorization: Bearer " . $this->gdriveApi->getGDriveToken(), "Content-Type: application/json")));
        return $newFile;


        $newFile->setDetachedFile($detached_file);

        $newFile->setLastModified();

        if (!$isDirectory) {

            $this->doctrine->persist($newFile);
            $this->doctrine->flush();

            $fileVersion = new DriveFileVersion($newFile);
            $newFile->setLastVersion($fileVersion);

            $path = $this->getRoot() . $newFile->getPath();
            $this->verifyPath($path);
            $this->writeEncode($path, $fileVersion->getKey(), $content, $fileVersion->getMode());
            $size = filesize($path);

            $fileVersion->setSize($size);
            $this->doctrine->persist($fileVersion);

        } else {
            $size = 10;
        }

        $newFile->setSize($size);

        if (!$detached_file) {
            $this->updateSize($directory, $size);
            $this->improveName($newFile);
        }

        $this->doctrine->persist($newFile);
        $this->doctrine->flush();

        $this->pusher->push(Array("action" => "update"), "drive/" . $newFile->getGroup()->getId());

        return $newFile;
    }

    public function getPreview($workspace, $fileid)
    {
        return $this->gdriveApi->getPreview($fileid);
    }

    public function getRawContent($workspace, $file)
    {
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

        if ($file == null) {
            return false;
        }
        if (!$this->isWorkspaceAllowed($workspace, $file)) {
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

    public function setRawContent($file, $content = null, $newVersion = false)
    {
        /**
         * @var DriveFile
         */
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

        if ($file == null) {
            return false;
        }

        /*$path = $this->getRoot() . $file->getPath();

        if (file_exists($path)) {

            if ($newVersion) {
                $newVersion = new DriveFileVersion($file);
                $file->setLastVersion($newVersion);
                $this->doctrine->persist($newVersion);
            }

            if ($content != null) {
                $this->verifyPath($path);
                $this->writeEncode($path, $file->getLastVersion()->getKey(), $content, $file->getLastVersion()->getMode());
            }

            $file->setSize(filesize($path));
            $file->setLastModified();
            $this->updateSize($file->getParent(), $file->getSize());

        } else {
            $this->delete($file);
        }

        $this->doctrine->persist($file);
        $this->doctrine->flush();

        $this->genPreview($file);*/

        return false;
    }

    public function getInfos($workspace, $fileOrDirectory, $forceAccess = false)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        return $this->gdriveApi->getInfos($workspace,$fileOrDirectory);
    }

    public function getWorkspace($fileOrDirectory)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
        if (!$fileOrDirectory) {
            return null;
        }
        return $fileOrDirectory->getGroup();
    }


    public function listDirectory($workspaceId, $directory, $trash = false)
    {
        $workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");
        if($directory===0)
            $directory = "sharedWithMe or 'root'";//
        else{
            $directory = "'".$directory."'";
        }

        return $this->gdriveApi->listFiles($workspace,$directory);
    }

    public function search($workspace, $query, $offset = 0, $max = 20)
    {
        if ($query == "") {
            return Array();
        }

        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if ($workspace == null) {
            return false;
        }

        return $this->gdriveApi->searchNameContains($workspace,$query,$offset,$max);
    }

    public function byLabel($workspace, $label, $offset = 0, $max = 20)
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

    public function listNew($workspace, $offset = 0, $max = 20)
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
        $list = $this->gdriveApi->listTrash($workspace);
        return $list;
    }

    public function autoDelete($workspace, $fileOrDirectory)
    {
        if ($fileOrDirectory == null) {
            return false;
        }
        $file = $this->gdriveApi->getGDriveFileFromGDriveId($fileOrDirectory);
        // If already in trash force remove
        if ($file->getTrashed()) {
            return $this->delete($fileOrDirectory);
        }else {
            return $this->toTrash($fileOrDirectory);
        }

        return true;
    }

    public function toTrash($fileOrDirectory){
        $rep = $this->gdriveApi->setTrashed($fileOrDirectory, true);

        return true;
    }

    public function delete($fileOrDirectory, $flush = true)
    {
        if ($fileOrDirectory == null) {
            return false;
        }

        $this->gdriveApi->delete($fileOrDirectory);

        return true;
    }

    public function restore($fileOrDirectory)
    {
        $this->gdriveApi->setTrashed($fileOrDirectory, false);

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
            $this->delete($child->getId(), false);
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

    public function upload($workspace, $directory, $file, $uploader, $detached = false)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        $file = $this->gdriveApi->upload($file, $directory);

        $newFile = $this->gdriveApi->getDriveFileFromGDriveFile($workspace, $file);

        return $newFile;

    }

    /*public function recursZip($workspace, &$zip, $directory, $prefix, $working_dir)
    {
        if ($prefix != "") {
            $zip->addEmptyDir($prefix);
        }
        if ($directory == null) {
            $children = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
                ->listDirectory($workspace, null, false);
        } else {
            $children = $directory->getChildren();
        }
        foreach ($children as $child) {
            if ($child->getIsDirectory()) {
                $dirname = $child->getName();
                $dirname = mb_ereg_replace("([^\w\s\d\-_~,;\[\]\(\).])", '', $dirname);
                $dirname = mb_ereg_replace("([\.]{2,})", '', $dirname);
                if ($dirname == "") {
                    $dirname = "no_name";
                }
                $this->recursZip($workspace, $zip, $child, $prefix . $dirname . "/", $working_dir);
            } else {
                $filename = $child->getName();
                $filename = mb_ereg_replace("([^\w\s\d\-_~,;\[\]\(\).])", '', $filename);
                $filename = mb_ereg_replace("([\.]{2,})", '', $filename);
                if ($filename == "") {
                    $filename = "no_name";
                }

                $completePath = $this->getRoot() . $child->getPath();
                $realFile = $this->decode($completePath, $child->getLastVersion()->getKey(), $child->getLastVersion()->getMode());

                rename($realFile, $working_dir . "/" . basename($realFile));

                $zip->addFile($working_dir . "/" . basename($realFile), $prefix . $filename);
            }
        }
    }

    public function generateZip($workspace, $directory)
    {
        if ($directory == null || $directory->getIsDirectory()) {
            if (!$this->isWorkspaceAllowed($workspace, $directory)) {
                return false;
            }

            $zip = new ZipArchive;
            $name = bin2hex(random_bytes(16));
            $tmpPath = $this->getRoot() . "/tmp/" . $name . ".zip";
            if ($zip->open($tmpPath, ZipArchive::CREATE) === TRUE) {

                $working_dir = $this->getRoot() . "/tmp/" . $name;
                mkdir($working_dir);
                $this->recursZip($workspace, $zip, $directory, "", $working_dir);
                $zip->close();

                $cdir = scandir($working_dir);
                foreach ($cdir as $key => $value) {
                    if (!in_array($value, array(".", ".."))) {
                        @unlink($working_dir . "/" . $value);
                    }
                }
                @rmdir($working_dir);

                return $tmpPath;
            }
        }
        return false;
    }*/

    public function download($workspace, $file, $download)
    {
        $url = $this->gdriveApi->getOpenLink($file);
        if($url)
            header('Location:'.$url);
    }

    public function isWorkspaceAllowed()
    {
        return true;
    }

    public function copyFromExternalDrive($workspace, $directory, $externalDriveFileId)
    {
        //$workspace, $directory, $filename, $content = "";
        $gdriveFile = $this->gdriveApi->getGDriveFileFromGDriveId($externalDriveFileId);
        $content = "";

        if($gdriveFile->getWebContentLink()!=null) {
            $service = new Google_Service_Drive($this->gdriveApi->getClient());

            $response = $service->files->get($externalDriveFileId, array(
                'alt' => 'media'));
            $content = $response->getBody()->getContents();
        }

        return $this->driveFileSystem->create($workspace, $directory, $gdriveFile->getName(), $content, false, false, $gdriveFile->getWebViewLink());
    }

    public function copyToExternalDrive($workspace, $directory, $file)
    {
        $this->upload($workspace,$directory,$file,null);
    }
}
