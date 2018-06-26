<?php


namespace WebsiteApi\DriveBundle\Services;

use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\DriveBundle\Services\MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Services\AESCryptFileLib;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileLabel;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\DriveBundle\Model\DriveFileSystemInterface;
use ZipArchive;

class DriveFileSystem implements DriveFileSystemInterface
{

    var $doctrine;
    var $root;
    var $parameter_drive_salt;
    var $pricingService;
    var $preview;
    var $pusher;

    public function __construct($doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher,$applicationService)
    {
        $this->doctrine = $doctrine;
        $this->root = $rootDirectory;
        $this->parameter_drive_salt = $parameter_drive_salt;
        $this->pricingService = $pricing;
        $this->preview = $preview;
        $this->pusher = $pusher;
        $this->applicationService = $applicationService;
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
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if ($workspace == null) {
            return false;
        }

        // Get total size from root directory(ies) and file(s)
        $totalSize = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->sumSize($workspace);

        return $totalSize;
    }

    public function getFreeSpace($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        return $this->getTotalSpace($workspace) - $this->getUsedSpace($workspace);
    }

    public function getTotalSpace($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        if ($workspace == null) {
            return false;
        }
        $limit = $this->pricingService->getLimitation($workspace->getId(), "drive", 1000000000);

        return $limit * 1000000;

    }

    public function setTotalSpace($workspace, $space)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        if ($workspace == null) {
            return false;
        }
        return $workspace->setDriveSize($space);
    }

    public function canAccessTo($file, $workspaceId, $user = null)
    {
        $workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");
        if ($workspace == null) {
            return false;
        }
        if ($file == null) {
            return true;
        }
        return $file->getDetachedFile() || $this->isWorkspaceAllowed($workspaceId, $file);
    }


    private function getRoot()
    {
        return dirname($this->root) . "/" . "drive" . "/";
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

        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
        $directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");

        if ($fileOrDirectory == null) {
            return false;
        }

        if ($directory != null && $fileOrDirectory->getId() == $directory->getId()) {
            return false;
        }

        if ($fileOrDirectory->getShared() && $fileOrDirectory->getGroup()->getId() != $directory->getGroup()->getId()) {
            return false;
        }

        $dir = $directory;
        while ($dir != null) {
            if ($dir->getId() == $fileOrDirectory->getId()) {
                error_log("MOVED FILE IN DRIVE : PARENT INFINITE LOOP");
                return false;
            }
            $dir = $dir->getParent();
        }

        //Update directories size
        $this->updateSize($fileOrDirectory->getParent(), -$fileOrDirectory->getSize());
        $this->updateSize($directory, $fileOrDirectory->getSize());

        $fileOrDirectory->setParent($directory);

        $this->improveName($fileOrDirectory);

        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->flush();

        $this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getGroup()->getId());

        return true;
    }

    private function recursCopy($inFile, $outFile)
    {
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
                    $child->getIsDirectory(),
                    $child->setCopyOf(null),
                    $child->getUrl()
                );

                $newFile->setSize($child->getSize());

                $this->doctrine->persist($newFile);

                $this->recursCopy($child, $newFile);

            }
        }
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
            $fileOrDirectory->getIsDirectory(),
            $fileOrDirectory->setCopyOf(null),
            $fileOrDirectory->getUrl()
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
            $fileOrDirectory,
            $fileOrDirectory->getUrl()
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

        return true;
    }

    public function rename($fileOrDirectory, $filename, $description = null, $labels = Array())
    {

        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");

        if ($fileOrDirectory == null) {
            return false;
        }

        //Update labels
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

        //End update label

        $fileOrDirectory->setName($filename);
        $fileOrDirectory->setDescription($description);
        $fileOrDirectory->setCache("labels", $labels);
        $this->improveName($fileOrDirectory);
        $this->doctrine->persist($fileOrDirectory);

        //Flush
        $this->doctrine->flush();

        $this->updateLabelsCount($fileOrDirectory->getGroup());

        $this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getGroup()->getId());

        return true;

    }

    public function create($workspace, $directory, $filename, $content = "", $isDirectory = false, $detached_file = false, $url =null)
    {

        if ($directory == 0 || $detached_file) {
            $directory = null;
        }

        $directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if (!$this->isWorkspaceAllowed($workspace, $directory)) {
            return false;
        }

        if (!$detached_file && ($workspace == null || $this->getFreeSpace($workspace) <= 0)) {
            return false;
        }

        $newFile = new DriveFile(
            $workspace,
            $directory,
            $filename,
            $isDirectory,
            null,
            $url
        );

        if ($url!=null){
            $app = $this->applicationService->getAppForUrl($url);
            $newFile->setDefaultWebApp($app);
        }

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

    public function getPreview($workspace, $file)
    {
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

        if ($file == null) {
            return false;
        }
        if (!$this->isWorkspaceAllowed($workspace, $file)) {
            return false;
        }

        $path = $this->getRoot() . $file->getPreviewPath();

        $this->verifyPath($path);

        if (!file_exists($path)) {
            return null;
        }

        return $this->read($path);

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

        $path = $this->getRoot() . $file->getPath();

        $this->verifyPath($path);

        if (!file_exists($path)) {
            return null;
        }

        return $this->readDecode($path, $file->getLastVersion()->getKey(), $file->getLastVersion()->getMode());
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

        $path = $this->getRoot() . $file->getPath();

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

        $this->genPreview($file);

        return true;
    }

    public function getInfos($workspace, $fileOrDirectory, $forceAccess = false)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
        if (!$forceAccess) {
            if (!$this->isWorkspaceAllowed($workspace, $fileOrDirectory->getParent())) {
                return false;
            }
        }
        if ($fileOrDirectory == null) {
            return false;
        }

        $data = $fileOrDirectory->getAsArray();

        return $data;
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

        $directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");
        $workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");

        if ($workspace == null) {
            return false;
        }
        if (!$this->isWorkspaceAllowed($workspaceId, $directory)) {
            return false;
        }

        if ($directory) {
            $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
                ->listDirectory($workspace, $directory, $trash, false);
        } else {
            $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
                ->listDirectory($workspace, null, $trash, false);
        }

        return $list;
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

        $sort = Array();

        $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->search($workspace, $query, $sort, $offset, $max);

        return $list;
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

        /** @var DriveLabel $label */
        $label = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel")->find($label);
        if ($label->getWorkspace()->getId() == $workspace->getId()) {
            /** @var DriveFileLabel[] $filesLabels */
            $filesLabels = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileLabel")->findBy(Array("label" => $label), Array(), $max, $offset);
            foreach ($filesLabels as $fileLabel) {
                $list[] = $fileLabel->getFile();
            }
        }

        return $list;

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

        $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->listDirectory($workspace, null, true);
        return $list;
    }

    public function autoDelete($workspace, $fileOrDirectory)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

        if ($fileOrDirectory == null) {
            return false;
        }
        if (!$this->isWorkspaceAllowed($workspace, $fileOrDirectory)) {
            return false;
        }
        //if deleting a shared file
        if ($fileOrDirectory->getIsDirectory() && $fileOrDirectory->getGroup()->getId() != $workspace) {
            return $this->unshare($fileOrDirectory->getGroup()->getId(), $fileOrDirectory, $workspace, false);
        }

        // If already in trash force remove
        if ($fileOrDirectory->getIsInTrash()) {
            return $this->delete($fileOrDirectory);
        }else {
            return $this->toTrash($fileOrDirectory);
        }

        return true;
    }

    public function toTrash($fileOrDirectory){
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

        if(!$fileOrDirectory){
            return false;
        }
        $fileOrDirectory->setOldParent($fileOrDirectory->getParent());
        $fileOrDirectory->setParent(null); //On le met dans le root de la corbeille
        $fileOrDirectory->setIsInTrash(true);

        $this->updateSize($fileOrDirectory->getOldParent(), -$fileOrDirectory->getSize());

        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->flush();

        return true;
    }

    private function recursDelete($fileOrDirectory)
    {
        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
        $userToNotifyRepo->deleteByDriveFile($fileOrDirectory);

        if ($fileOrDirectory == null) {
            return false;
        }

        $this->updateSize($fileOrDirectory->getParent(), -$fileOrDirectory->getSize());

        if (!$fileOrDirectory->getIsDirectory()) {

            // Remove real file
            $real = $this->getRoot() . $fileOrDirectory->getPath();
            if (file_exists($real)) {
                unlink($real);
            }
            // Remove preview file
            $real = $this->getRoot() . $fileOrDirectory->getPreviewPath();
            if (file_exists($real)) {
                unlink($real);
            }

        } else {
            $copies = $driveRepository->findBy(Array("copyOf" => $fileOrDirectory));
            foreach ($copies as $copy) {
                $this->doctrine->remove($copy);
            }
            foreach ($fileOrDirectory->getChildren() as $child) {

                $this->recursDelete($child);

            }
        }

        $this->removeLabels($fileOrDirectory, false);
        $this->doctrine->remove($fileOrDirectory);

        return true;
    }

    public function delete($fileOrDirectory, $flush = true)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");

        if ($fileOrDirectory == null) {
            return false;
        }

        $this->recursDelete($fileOrDirectory);

        if ($flush) {
            $this->doctrine->flush();
            $this->updateLabelsCount($fileOrDirectory->getGroup());
        }

        return true;
    }

    private function removeLabels($fileOrDirectory, $flush = true)
    {

        $labels_link = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileLabel")->findBy(Array("file" => $fileOrDirectory));

        foreach ($labels_link as $label_link) {
            $this->doctrine->remove($label_link);
        }

        if ($flush) {
            $this->doctrine->flush();
        }

    }

    public function restore($fileOrDirectory)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

        if ($fileOrDirectory == null) {
            return false;
        }

        $fileOrDirectory->setParent($fileOrDirectory->getOldParent()); //On le met dans le root de la corbeille
        $fileOrDirectory->setIsInTrash(false);

        $this->updateSize($fileOrDirectory->getParent(), $fileOrDirectory->getSize());

        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->flush();

        return true;
    }

    public function emptyTrash($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");;

        if ($workspace == null) {
            return false;
        }

        if ($this->listTrash($workspace) == false) {
            return false;
        }

        $list = $this->listTrash($workspace);

        foreach ($list as $child) {
            $this->delete($child, false);
        }

        $this->updateLabelsCount($workspace);

        $this->pusher->push(Array("action" => "update"), "drive/" . $workspace->getId());

        return true;
    }

    public function restoreTrash($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");;

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

        $newFile = $this->create($workspace, $directory, $file["name"], "", false, $detached);
        if (!$file) {
            return false;
        }

        $real = $this->getRoot() . $newFile->getPath();
        $context = Array(
            "max_size" => 100000000 // 100Mo
        );
        $errors = $uploader->upload($file, $real, $context);

        $ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));

        $path = $this->getRoot() . dirname($newFile->getPreviewPath()) . "/";
        $this->preview->generatePreview($newFile->getLastVersion()->getRealName(), $real, $path, $ext);

        $this->encode($this->getRoot() . $newFile->getPath(), $newFile->getLastVersion()->getKey(), $newFile->getLastVersion()->getMode());

        $this->setRawContent($newFile);

        if (count($errors["errors"]) > 0) {
            $this->delete($newFile);
            return false;
        }

        return $newFile;

    }

    public function recursZip($workspace, &$zip, $directory, $prefix, $working_dir)
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
    }

    public function download($workspace, $file, $download)
    {

        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

        if (!$this->isWorkspaceAllowed($workspace, $file)) {
            return false;
        }
        //Directory : download as zip
        if ($file == null || $file->getIsDirectory()) { //Directory or root

            if ($file == null) {
                $totalSize = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->sumSize($workspace);
                if ($totalSize > 1000000000) //1Go is too large
                {
                    return false;
                }
            } else if ($file->getSize() > 1000000000) //1Go is too large
            {
                return false;
            }

            $zip_path = $this->generateZip($workspace, $file);

            if (!$zip_path) {
                return false;
            }

            $archive_name = ($file ? $file->getName() : "Documents");

            header('Content-Type: application/octet-stream');
            header("Content-type: application/force-download");
            header('Content-Disposition: attachment; filename="' . $archive_name . ".zip" . '"');

            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($zip_path));

            $fp = fopen($zip_path, "r");

            ob_clean();
            flush();
            while (!feof($fp)) {
                $buff = fread($fp, 1024);
                print $buff;
            }

            //Delete decoded file
            @unlink($zip_path);

            exit;
            die();

        } else {

            $completePath = $this->getRoot() . $file->getPath();

            ini_set('memory_limit', '10M');

            $completePath = $this->decode($completePath, $file->getLastVersion()->getKey(), $file->getLastVersion()->getMode());


            $ext = $this->getInfos(null, $file, true)['extension'];

            header('Content-Description: File Transfer');


            if ($download) {
                header('Content-Type: application/octet-stream');
                header("Content-type: application/force-download");
                header('Content-Disposition: attachment; filename="' . $file->getName() . '"');
            } else {

                header('Content-Disposition: inline; filename="' . $file->getName() . '"');

                if (in_array($ext, ["gif", "svg", "jpeg", "jpg", "tiff", "png"])) {
                    header('Content-Type: image; filename="' . $file->getName() . '"');
                }
                if ($ext == "pdf") {
                    header("Content-type: application/pdf");
                }
            }

            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($completePath));

            $fp = fopen($completePath, "r");

            ob_clean();
            flush();
            while (!feof($fp)) {
                $buff = fread($fp, 1024);
                print $buff;
            }

            //Delete decoded file
            @unlink($completePath);

            exit;
            die();
        }

    }

    private function verifyPath($path)
    {
        $path = dirname($path);
        if (!file_exists($path)) {
            mkdir($path, 0777, true);
        }
    }

    private function encode($path, $key, $mode = "AES")
    {

        if ($mode == "AES") {
            $mcrypt = new MCryptAES256Implementation();
            $lib = new AESCryptFileLib($mcrypt);
        }
        if ($mode == "OpenSSL") {
            $lib = new OpenSSLCryptLib();
        }
        if ($mode == "OpenSSL-2") {
            $lib = new OpenSSLCryptLib();
            $key = $mode . $this->parameter_drive_salt . $key;
        }

        $pathTemp = $path . ".tmp";
        rename($path, $pathTemp);

        $lib->encryptFile($pathTemp, $key, $path);

        @unlink($pathTemp);

    }

    private function decode($path, $key, $mode = "AES")
    {

        if ($mode == "AES") {
            $mcrypt = new MCryptAES256Implementation();
            $lib = new AESCryptFileLib($mcrypt);
        }
        if ($mode == "OpenSSL") {
            $lib = new OpenSSLCryptLib();
        }
        if ($mode == "OpenSSL-2") {
            $lib = new OpenSSLCryptLib();
            $key = $mode . $this->parameter_drive_salt . $key;
        }

        $tmpPath = $this->getRoot() . "/tmp/" . bin2hex(random_bytes(16));
        $this->verifyPath($tmpPath);

        $lib->decryptFile($path, $key, $tmpPath);

        return $tmpPath;

    }

    private function writeEncode($path, $key, $content, $mode = "AES")
    {
        file_put_contents($path, $content);
        if ($content != "") {
            $this->encode($path, $key, $mode);
        }
    }

    private function readDecode($path, $key, $mode = "AES")
    {
        $path = $this->decode($path, $key, $mode);
        $var = file_get_contents($path);
        @unlink($path);
        return $var;
    }

    private function read($path)
    {
        $var = file_get_contents($path);
        return $var;
    }

    public function genPreview(DriveFile $file)
    {

        if (!$file->getIsDirectory() && $file->getLastVersion()) {

            $path = $this->getRoot() . "/" . $file->getPath();
            $previewPath = $this->getRoot() . "/" . $file->getPreviewPath();

            $this->verifyPath($previewPath);

            $ext = $file->getExtension();
            $tmppath = $this->decode($path, $file->getLastVersion()->getKey(), $file->getLastVersion()->getMode());
            rename($tmppath, $tmppath . ".tw");
            $tmppath = $tmppath . ".tw";

            try {
                $this->preview->generatePreview(basename($path), $tmppath, dirname($path), $ext);
                if (file_exists($path . ".png")) {
                    rename($path . ".png", $previewPath);
                } else {
                    error_log("FILE NOT GENERATED !");
                }
            } catch (\Exception $e) {

            }

            @unlink($tmppath);

        }

    }

    //Used to show content of a drive folder since now other group can see others content
    public function isWorkspaceAllowed($workspaceId, $directoryId)
    {
        if ($directoryId == null) {
            return true;
        }
        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");


        $dir = $this->convertToEntity($directoryId, "TwakeDriveBundle:DriveFile");

        if ($dir->getDetachedFile()) {
            return true;
        }

        while ($dir != null) {
            //If it's mine
            if ($workspace->getId() == $dir->getGroup()->getId()) {
                return true;
            }
            //if it's shared..
            if ($dir->getShared()) {

                //to me
                $directoryaccess = $driveRepository->findOneBy(Array("group" => $workspace, "copyOf" => $dir));
                if ($directoryaccess) {
                    return true;
                }
            }
            //we go upward to see if a parent is shared to us
            $dir = $dir->getParent();
        }
        return false;
    }

    private function updateLabelsCount($workspace, $flush = true)
    {
        $labelsRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel");

        foreach ($labelsRepository->findBy(Array("workspace" => $workspace)) as $label) {
            $count = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileLabel")->countByLabel($label);
            $label->setNumber($count);
            $this->doctrine->persist($label);
        }

        if ($flush) {
            $this->doctrine->flush();
        }

    }

    public function open($file){
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");
        if ($file != null){
            $file->setOpeningRate( $file->getOpeningRate() + 1);
            $this->doctrine->persist($file);
            $this->doctrine->flush();
            return true;
        }

        return false;
    }

    public function decreaseOpeningFile(){
        $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->decreaseOpeningRate();
    }


    public function getFilesFromApp($app,$workspace_id){
        $app = $this->convertToEntity($app, "TwakeMarketBundle:Application");

        $listFiles = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(array('default_app' => $app, 'group' => $workspace_id),array('opening_rate'=> 'desc'),20);
        return $listFiles;
    }
}
