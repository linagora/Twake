<?php


namespace WebsiteApi\DriveBundle\Services;

use WebsiteApi\CoreBundle\Services\Translate;
use WebsiteApi\CoreBundle\Services\TranslationObject;
use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\DriveBundle\Services\MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Services\AESCryptFileLib;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileLabel;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\DriveBundle\Model\DriveFileSystemInterface;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\WorkspacesBundle\Services\WorkspacesActivities;
use WebsiteApi\WorkspacesBundle\Services\WorkspacesApps;
use ZipArchive;

class DriveFileSystem
{

    var $doctrine;
    var $root;
    var $parameter_drive_salt;
    var $pricingService;
    var $preview;
    var $pusher;
    /* @var UserToNotifyService $userToNotifyService */
    var $userToNotifyService;
    /* @var Translate $translate*/
    var $translate;
    /* @var WorkspacesApps $workspacesApps */
    var $workspacesApps;
    /* @var WorkspacesActivities $workspacesActivities*/
    var $workspacesActivities;

    var $objectLinkSystem;

    public function __construct($doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher, $applicationService, $userToNotifyService, $translate, $workspacesApps, $workspacesActivities, $objectLinkSystem)
    {
        $this->doctrine = $doctrine;
        $this->root = $rootDirectory;
        $this->parameter_drive_salt = $parameter_drive_salt;
        $this->pricingService = $pricing;
        $this->preview = $preview;
        $this->pusher = $pusher;
        $this->applicationService = $applicationService;
        $this->userToNotifyService = $userToNotifyService;
        $this->translate = $translate;
        $this->workspacesApps = $workspacesApps;
        $this->workspacesActivities = $workspacesActivities;
        $this->objectLinkSystem = $objectLinkSystem;
    }

    protected function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var) || get_class($var) == "Ramsey\Uuid\Uuid") {
            return $this->doctrine->getRepository($repository)->findOneBy(Array("id" => $var));
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function getRootEntity($workspace_id)
    {
        $root = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->findOneBy(Array("workspace_id" => $workspace_id, "isintrash" => false, "parent_id" => ""));
        if (!$root) {
            $root = new DriveFile($workspace_id, "", true);
            $this->doctrine->persist($root);
            $this->doctrine->flush();
        }
        return $root;
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

    public function verifyPublicAccess($object, $publicAccessKey)
    {
        if (strlen($publicAccessKey) < 20) {
            return false;
        }
        if (!$object) {
            return false;
        }

        $access_allowed = false;
        $parent = $this->convertToEntity($object, "TwakeDriveBundle:DriveFile");
        while ($parent != null) {
            if ($parent->getPublicAccessKey() == $publicAccessKey) {
                $access_allowed = true;
                $parent = null;
            } else {
                $parent = $parent->getParentId();
            }
        }
        return $access_allowed;
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


    protected function getRoot()
    {
        return dirname($this->root) . "/" . "drive" . "/";
    }

    // @improveName updates name of object in case a directory already exists where we want to move it

    /**
     * @param $fileOrDirectory
     */
    protected function improveName($fileOrDirectory)
    {
        $originalCompleteName = explode(".", $fileOrDirectory->getName());
        $originalExt = "";
        if (count($originalCompleteName) > 1) {
            $originalExt = array_pop($originalCompleteName);
        }
        $originalName = join(".", $originalCompleteName);

        $currentNames = [];

        $file_repo = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");

        $brothers = $file_repo->findBy(Array("workspace_id" => $fileOrDirectory->getWorkspaceId(), "parent_id" => $fileOrDirectory->getParentId()));

        if ($brothers && count($brothers) > 0) {
            foreach ($brothers as $brother) {
                if ($brother->getId() != $fileOrDirectory->getId()) {
                    $currentNames[] = $brother->getName();
                }
            }
        } else {
            return; // Ok file is alone
        }

        $fileOrDirectory->setExtension($originalExt);

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

    protected function updateSize($directory, $delta)
    {
        if (!$directory || is_string($directory)) {
            $directory = null;
        }

        while ($directory != null) {

            if ($directory == "root") {
                $directory = $this->getRootEntity();
            }

            if (!$directory || is_string($directory)) {
                $directory = null;
            } else {

                $currentSize = $directory->getSize();
                $directory->setSize($currentSize + $delta);
                $this->doctrine->persist($directory);
                $directory = $directory->getParentId();

            }
        }
    }

    public function move($fileOrDirectory, $directory, $groupId = null, $userId = 0)
    {
        /* @var DriveFile $fileOrDirectory */
        /* @var DriveFile $directory */
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
        $directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");

        if ($fileOrDirectory == null) {
            return false;
        }

        if ($directory != null && $fileOrDirectory->getId() == $directory->getId()) {
            return false;
        }

        if ($fileOrDirectory->getShared() && $fileOrDirectory->getWorkspaceId() != $directory->getWorkspaceId()) {
            return false;
        }

        $dir = $directory;
        while ($dir != null) {
            if ($dir->getId() == $fileOrDirectory->getId()) {
                error_log("MOVED FILE IN DRIVE : PARENT INFINITE LOOP");
                return false;
            }
            $dir = $dir->getParentId();
            if ($dir) {
                $dir = $this->convertToEntity($dir, "TwakeDriveBundle:DriveFile");
            } else {
                $dir = null;
            }
        }

        //Update directories size
        $this->updateSize($fileOrDirectory->getParentId(), -$fileOrDirectory->getSize());
        $this->updateSize($directory, $fileOrDirectory->getSize());
        $fileOrDirectory->setDetachedFile(false);

        $this->doctrine->remove($fileOrDirectory);
        $this->doctrine->flush();

        $fileOrDirectory->setParentId($directory->getId());

        $this->improveName($fileOrDirectory);

        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->flush();

        $dirid = 0;
        $dirName = "";

        if($directory!=null) {
            $dirid = $directory->getId();
            $dirName = $directory->getName();
        }

        /*$this->userToNotifyService->notifyUsers($dirid,$groupId, "drive.move_file",
            new TranslationObject($this->translate,"drive.has_been_moved", $fileOrDirectory->getName(), $dirName),
            $fileOrDirectory->getId(), $userId);
        $this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getWorkspaceId());
        $this->workspacesActivities->recordActivity($fileOrDirectory->getWorkspaceId(), $userId, "drive", "workspace.activity.file.move", "TwakeDriveBundle:DriveFile", $fileOrDirectory->getId());*/

        return true;
    }

    protected function recursCopy($inFile, $outFile)
    {
        if (!$inFile->getIsDirectory()) {

            //Copy real file
            $from = $this->getRoot() . $inFile->getPath();
            $to = $this->getRoot() . $outFile->getPath();

            if ($this->file_exists($from, $inFile)) {
                copy($from, $to);
            } else {
                $this->delete($inFile);
                return;
            }

        } else {

            foreach ($inFile->getChildren() as $child) {

                $newFile = new DriveFile(
                    $child->getWorkspaceId(),
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

    public function getSharedWorkspace($groupId, $fileId)
    {
        $directory = $this->convertToEntity($fileId, "TwakeDriveBundle:DriveFile");

        if (!$this->isWorkspaceAllowed($groupId, $directory)) {
            return false;
        }

        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $shared = $driveRepository->findBy(Array("copyof" => $directory));

        return $shared;

    }

    public function isFolderOwner($groupId, $fileId)
    {
        $directory = $this->convertToEntity($fileId, "TwakeDriveBundle:DriveFile");

        if (!$this->isWorkspaceAllowed($groupId, $directory)) {
            return false;
        }

        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $res = $driveRepository->findOneBy(Array("id" => $fileId, "group" => $groupId, "copyof" => null));

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
        $copy = $driveRepository->findOneBy(Array("group" => $group, "copyof" => $directory));
        if ($copy) {
            return false; //already shared
        }

        $parent = $fileOrDirectory->getParentId();

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

        $this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getWorkspaceId());
        $this->pusher->push(Array("action" => "update"), "drive/" . $newFile->getWorkspaceId());

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
            $copies = $driveRepository->findBy(Array("copyof" => $directory));
            foreach ($copies as $copy) {
                $this->doctrine->remove($copy);
            }
            $fileOrDirectory->setShared(false);
        } else {
            //Set unshared if last
            $copies = $driveRepository->findBy(Array("copyof" => $directory));
            if (count($copies) == 1) {
                $fileOrDirectory->setShared(false);
            }

            $copy = $driveRepository->findOneBy(Array("group" => $targetgroupId, "copyof" => $directory));
            if ($copy == null) {
                return false;
            }
            $this->doctrine->remove($copy);
        }
        $this->doctrine->flush();

        $this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getWorkspaceId());
        $this->pusher->push(Array("action" => "update"), "drive/" . $targetgroupId);

        return true;
    }

    public function rename($fileOrDirectory, $filename, $description = null, $labels = Array(), $userId = 0)
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

        $this->updateLabelsCount($fileOrDirectory->getWorkspaceId());

        //$this->pusher->push(Array("action" => "update"), "drive/" . $fileOrDirectory->getWorkspaceId());
        //$this->workspacesActivities->recordActivity($fileOrDirectory->getWorkspaceId(), $userId, "drive", "workspace.activity.file.rename", "TwakeDriveBundle:DriveFile", $fileOrDirectory->getId());

        return true;

    }

    public function save($object, $user = null, $application = null)
    {

        $workspace = $object["workspace_id"];
        $directory = $object["parent_id"];

        if ($directory == "root") {
            $directory = $this->getRootEntity($workspace);
            $directory = $directory->getId();
        }

        $detached_file = $object["detached"];
        if ($detached_file && !$directory) {
            $directory = "detached";
        }
        $content = $object["content"];
        if (!$content) {
            $content = "";
        }
        $id = $object["id"];

        $filename = $object["name"];
        $isDirectory = $object["is_directory"];

        $drive_files_repo = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");

        $drive_element = null;

        if (isset($object["id"])) {
            $drive_element = $drive_files_repo->findOneBy(Array("id" => $id));

            //TODO check access
        }

        if ($drive_element == null) {

            //TODO check access

            //Create a new drive element
            $drive_element = new DriveFile($workspace, $directory, $isDirectory);
            $drive_element->setFrontId($object["front_id"]);

            if (!$isDirectory) {

                $this->doctrine->persist($drive_element);
                $this->doctrine->flush();

                $fileVersion = new DriveFileVersion($drive_element, $user);
                $this->doctrine->persist($fileVersion);
                $this->doctrine->flush();

                $drive_element->setLastVersionId($fileVersion->getId());

                $path = $this->getRoot() . $drive_element->getPath();
                $this->verifyPath($path);
                $size = strlen($content);
                $this->writeEncode($path, $fileVersion->getKey(), $content, $fileVersion->getMode());

                $fileVersion->setSize($size);

                $this->doctrine->persist($fileVersion);

            } else {
                $size = 10;
            }

            $drive_element->setSize($size);

            //TODO update workspace number of files

        }

        if ($object["parent_id"] != $drive_element->getParentId()) {
            //TODO change parent id (regenerate object)
        }

        $drive_element->setName($filename);

        if (!$detached_file) {
            if ($directory != "detached") {
                if ($directory != "root") {
                    $directory_ent = $drive_files_repo->findOneBy(Array("id" => $directory));
                } else {
                    $directory_ent = $this->getRootEntity($object["workspace_id"]);
                }
                $this->updateSize($directory_ent, $size);
            }
            $this->improveName($drive_element);
        } else {
            $drive_element->setDetachedFile(true);
        }

        $this->doctrine->persist($drive_element);
        $this->doctrine->flush();

        return $drive_element;

        //Old code

        /* if ($directory . "" == "0" || $detached_file) {
             $directory = null;
         }

         $directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");
         $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
         $user = $this->convertToEntity($userId, "TwakeUsersBundle:User");

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

         if ($url!=null) {
             if ($userApp) {
                 $userApp = $this->convertToEntity($userApp,"TwakeMarketBundle:Application");
             }
             if ($userApp) {
                 $newFile->setDefaultWebApp($userApp);
             } else {
                 $app = $this->applicationService->getAppForUrl($url);
                 if ($app) {
                     $newFile->setDefaultWebApp($app);
                 } else {
                     return false;
                 }
             }

             $datatopush = Array(
                 "type" => "CHANGE_WORKSPACE_EXTERNAL_FILES",
                 "data" => Array(
                     "workspaceId" => $workspace->getId(),
                 )
             );
             $this->pusher->push($datatopush, "group/" . $workspace->getId());

         }

         $newFile->setDetachedFile($detached_file);

         $newFile->setLastModified();

         if (!$isDirectory) {

             $this->doctrine->persist($newFile);
             $this->doctrine->flush();

             $fileVersion = new DriveFileVersion($newFile, $user);
             $newFile->setLastVersion($fileVersion);

             $path = $this->getRoot() . $newFile->getPath();
             $this->verifyPath($path);
             $size = strlen($content);
             $this->writeEncode($path, $fileVersion->getKey(), $content, $fileVersion->getMode());

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

         $dirName = "root";
         $dirid = 0;

         if($directory!=null){
             $dirid = $directory->getId();
             $dirName = $directory->getName();
         }
         $this->userToNotifyService->notifyUsers($dirid,$workspace,"drive.new_file",
             new TranslationObject($this->translate,"drive.has_been_added", $newFile->getName(), $dirName),
             $newFile->getId(), $userId);

         if (!$detached_file && !$isDirectory) {
             $this->workspacesActivities->recordActivity($workspace, $userId, "drive", "workspace.activity.file.create", "TwakeDriveBundle:DriveFile", $newFile->getId());
         }
         $this->pusher->push(Array("action" => "update"), "drive/" . $newFile->getWorkspaceId());

         return $newFile;*/
    }

    public function getPreview($workspace, $file_version)
    {
        $file_version = $this->convertToEntity($file_version, "TwakeDriveBundle:DriveFileVersion");

        if ($file_version == null) {
            return false;
        }
        if (!$this->isWorkspaceAllowed($workspace, $file_version->getFileId())) {
            return false;
        }

        $file = $this->convertToEntity($file_version->getFileId(), "TwakeDriveBundle:DriveFile");

        $preview_path = $this->getRoot() . "/" . $file->getPreviewPath();

        if (!$this->file_exists($preview_path, $file)) {
            return null;
        }

        return $this->read($preview_path);

    }

    public function rawPreview($file)
    {

        $path = $this->getRoot() . $file->getPath();

        $this->verifyPath($path);

        if (!$this->file_exists($path, $file)) {
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

        return $this->rawContent($file);
    }

    public function rawContent($file)
    {
        $path = $this->getRoot() . $file->getPath();
        $this->verifyPath($path);

        if (!$this->file_exists($path, $file)) {
            return null;
        }

        return $this->readDecode($path, $file->getLastVersion($this->doctrine)->getKey(), $file->getLastVersion($this->doctrine)->getMode());
    }

    public function setRawContent($file, $content = null, $newVersion = false, User $user=null)
    {
        /**
         * @var DriveFile
         */
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

        if ($file == null) {
            return false;
        }

        $path = $this->getRoot() . $file->getPath();

        if ($this->file_exists($path, $file)) {

            if ($newVersion) {
                $newVersion = new DriveFileVersion($file, $user);
                $file->setLastVersionId($newVersion->getId());
                $this->doctrine->persist($newVersion);
            }

            if ($content != null) {
                $this->verifyPath($path);
                $file->setSize(strlen($content));
                $this->writeEncode($path, $file->getLastVersion($this->doctrine)->getKey(), $content, $file->getLastVersion($this->doctrine)->getMode());
            }

            $file->setLastModified();

            if (!$file->getDetachedFile()) {
                $parent = $this->convertToEntity($file->getParentId(), "TwakeDriveBundle:DriveFile");
                $this->updateSize($parent, $file->getSize());
            }

        } else {
            $this->delete($file);
        }

        $this->doctrine->persist($file);
        $this->doctrine->flush();

        //$this->genPreview($file);

        return true;
    }

    public function getDriveFileVersions($fileId){
        $file = $this->convertToEntity($fileId, "TwakeDriveBundle:DriveFile");

        $drivefileVersions = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileVersion")->findBy(Array("file" => $file));

        return $drivefileVersions;
    }

    public function getInfos($workspace_id, $element_id)
    {

        if ($element_id == "root") {
            $element = $this->getRootEntity($workspace_id);
        } else {
            $element = $this->convertToEntity($element_id, "TwakeDriveBundle:DriveFile");
        }

        if (!$element || ($element->getWorkspaceId() != $workspace_id && !$element->getDetachedFile())) {
            return null;
        }

        return $element;
    }

    public function updatePublicAccessKey($fileOrDirectory, $publicAccessKey)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");

        $fileOrDirectory->setPublicAccessKey($publicAccessKey);

        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->flush();

        return true;
    }

    public function getWorkspace($fileOrDirectory)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
        if (!$fileOrDirectory) {
            return null;
        }
        return $fileOrDirectory->getWorkspaceId();
    }

    public function getPath($workspace_id, $directory_id)
    {

        $repo = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");

        if ($directory_id == "root") {
            $child = $this->getRootEntity($workspace_id);
            return [$child->getAsArray()];
        } else {
            $child = $repo->findOneBy(Array("id" => $directory_id));
        }

        if (!$child) {
            return [];
        }

        $list = [$child->getAsArray()];

        while ($child && $child->getParentId() && $child->getParentId() != "root") {
            $parent = $repo->findOneBy(Array("id" => $child->getParentId()));
            if ($parent) {
                $list[] = $parent->getAsArray();
                $child = $parent;
            } else {
                $child = null;
            }
        }

        $list = array_reverse($list);

        return $list;
    }

    public function listDirectory($workspaceId, $directoryId, $trash = false)
    {

        if (!$workspaceId) {
            return false;
        }

        /*if (!$this->isWorkspaceAllowed($workspaceId, $directoryId)) {
            return false;
        }*/

        $repo = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $root = $this->getRootEntity($workspaceId);

        if (!$directoryId || $directoryId == "root") {
            $directoryId = $root->getId();
        }

        if ($root->getId() == $directoryId) {
            $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $directoryId, "isintrash" => $trash));
        } else {
            $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $directoryId));
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
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if ($workspace == null) {
            return false;
        }

        $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->search($workspace, Array(), Array("added" => "DESC"), $offset, $max);
        return $list;
    }

    public function listLastUsed($workspace, $offset = 0, $max =20){
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if ($workspace == null) {
            return false;
        }

        $list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->search($workspace, Array(), Array("last_modified" => "DESC"), $offset, $max);
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

        $list = $this->listDirectory($workspace->getId(), null, true);
        return $list;
    }

    public function autoDelete($workspace, $fileOrDirectory, $user = null)
    {
        /** @var DriveFile $fileOrDirectory */
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");;

        if ($fileOrDirectory == null) {
            return false;
        }
        if (!$this->isWorkspaceAllowed($workspace, $fileOrDirectory)) {
            return false;
        }
        //if deleting a shared file
        if ($fileOrDirectory->getIsDirectory() && $fileOrDirectory->getWorkspaceId() != $workspace->getId()) {
            return $this->unshare($fileOrDirectory->getWorkspaceId(), $fileOrDirectory, $workspace, false);
        }

        // If already in trash force remove
        if ($fileOrDirectory->getIsInTrash()) {
            return $this->delete($fileOrDirectory);
        }else {
            return $this->toTrash($fileOrDirectory, $user);
        }

        return true;
    }

    public function toTrash($fileOrDirectory, $user){

        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");

        if(!$fileOrDirectory){
            return false;
        }

        $this->doctrine->remove($fileOrDirectory);
        $this->doctrine->flush();

        $fileOrDirectory->setOldParent($fileOrDirectory->getParentId());
        $fileOrDirectory->setParentId($this->getRootEntity($fileOrDirectory->getWorkspaceId())->getId()); //On le met dans le root de la corbeille
        $fileOrDirectory->setIsInTrash(true);

        $this->updateSize($fileOrDirectory->getOldParent(), -$fileOrDirectory->getSize());

        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->flush();

        $app = $fileOrDirectory->getDefaultWebApp();

        if($app){
            $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("default_web_app" => $app, "group" => $fileOrDirectory->getWorkspaceId(), "isintrash" => false));
            if(count($files)==0){
                $this->workspacesApps->disableApp($fileOrDirectory->getWorkspaceId(), $app->getId());
            }
        }

        //$this->workspacesActivities->recordActivity($fileOrDirectory->getWorkspaceId(),$user,"drive","workspace.activity.file.trash","TwakeDriveBundle:DriveFile", $fileOrDirectory->getId());
        return true;
    }

    protected function deleteFile($file)
    {
        // Remove real file
        $real = $this->getRoot() . $file->getPath();
        if ($this->file_exists($real, $file)) {
            unlink($real);
        }
        // Remove preview file
        $real = $this->getRoot() . $file->getPath();
        if ($this->file_exists($real, $file)) {
            unlink($real);
        }
    }

    protected function recursDelete($fileOrDirectory)
    {

        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
//        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
//        $userToNotifyRepo->deleteByDriveFile($fileOrDirectory);

        if ($fileOrDirectory == null) {
            return false;
        }

        $this->updateSize($fileOrDirectory->getParentId(), -$fileOrDirectory->getSize());

        if (!$fileOrDirectory->getIsDirectory()) {

            $this->deleteFile($fileOrDirectory);

        } else {
//            $copies = $driveRepository->findBy(Array("copyof" => $fileOrDirectory));
//            foreach ($copies as $copy) {
//                $this->doctrine->remove($copy);
//            }
            foreach ($this->listDirectory($fileOrDirectory->getWorkspaceId(), $fileOrDirectory->getId(), false) as $child) {
                $this->recursDelete($child);
            }
        }

//        $this->objectLinkSystem->deleteObject($fileOrDirectory);
//        $this->removeLabels($fileOrDirectory, false);
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
//            $this->updateLabelsCount($fileOrDirectory->getWorkspaceId());
        }

        return true;
    }

    protected function removeLabels($fileOrDirectory, $flush = true)
    {

        $labels_link = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileLabel")->findBy(Array("file" => $fileOrDirectory));

        foreach ($labels_link as $label_link) {
            $this->doctrine->remove($label_link);
        }

        if ($flush) {
            $this->doctrine->flush();
        }

    }

    public function restore($fileOrDirectory, $user=null)
    {
        $fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

        if ($fileOrDirectory == null) {
            return false;
        }

        $this->doctrine->remove($fileOrDirectory);
        $this->doctrine->flush();

        $fileOrDirectory->setParentId($fileOrDirectory->getOldParent()); //On le met dans le root de la corbeille
        $fileOrDirectory->setIsInTrash(false);

        $this->updateSize($fileOrDirectory->getParentId(), $fileOrDirectory->getSize());

        $this->doctrine->persist($fileOrDirectory);
        $this->doctrine->flush();


        $app = $fileOrDirectory->getDefaultWebApp();

        if($app){
            $this->workspacesApps->enableApp($fileOrDirectory->getWorkspaceId(), $app->getId());
        }

        //$this->workspacesActivities->recordActivity($fileOrDirectory->getWorkspaceId(),$user,"drive","workspace.activity.file.restore","TwakeDriveBundle:DriveFile", $fileOrDirectory->getId());
        return true;
    }

    public function emptyTrash($workspace_id)
    {
        $workspace = $this->convertToEntity($workspace_id, "TwakeWorkspacesBundle:Workspace");;

        if ($workspace == null) {
            return false;
        }

        $list = $this->listDirectory($workspace_id, "", true);

        if (!$list) {
            return;
        }

        foreach ($list as $child) {
            $this->delete($child, false);
        }

//        $this->updateLabelsCount($workspace);

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

    public function uploadNewVersion($workspace, $directory, $fileData, $uploader, $detached = false, $userId = 0, $newVersion = 0)
    {
        if(is_numeric($directory))
            $directory = intval($directory);
        /* @var DriveFile $file */
        $file = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $newVersion));
        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $userId));
        if ($userId . "" == "0")
            $user = null;
        $file->setName($fileData["name"]);
        $file->setPreviewHasBeenGenerated(false);

        $lastVersion = new DriveFileVersion($file,$user);
        $this->doctrine->persist($lastVersion);
        $file->setLastVersionId($lastVersion->getId());

        if (!$fileData || !$file) {
            return false;
        }

        $real = $this->getRoot() . $file->getPath();
        $size = filesize($fileData["tmp_name"]);

        $file->setSize($size);

        $context = Array(
            "max_size" => 5000000000 // 5Go
        );
        $errors = $uploader->upload($fileData, $real, $context);

        $this->encode($this->getRoot() . $file->getPath(), $file->getLastVersion($this->doctrine)->getKey(), $file->getLastVersion($this->doctrine)->getMode());

        $this->setRawContent($file, null, false, $user);

        if (count($errors["errors"]) > 0) {
            $this->delete($file);
            return false;
        }
        $dirid = 0;

        if($directory!=null && !is_int($directory)) {
            $dirid = $directory->getId();
        }else if(is_int($directory))
            $dirid = $directory;

        /*$this->userToNotifyService->notifyUsers($dirid,$workspace,"drive.file_updated",
            new TranslationObject($this->translate,"drive.has_been_update", $file->getName()),
            $file->getId(), $userId);
        $this->pusher->push(Array("action" => "update"), "drive/" . $file->getWorkspaceId());
        $this->workspacesActivities->recordActivity($workspace,$userId,"drive","workspace.activity.file.upload_new_version","TwakeDriveBundle:DriveFile", $file->getId());*/


        if ($this->preview->isImage($file->getExtension())) {
            $this->genPreview($file);
            $file->setPreviewHasBeenGenerated(true);
            $file->setHasPreview(true);
            $this->doctrine->persist($file);
            $this->doctrine->flush();
        }

        return $file;

    }

    public function upload($object, $file, $uploader, $user = null, $application = null)
    {

        $newFile = $this->save($object, $user, $application);

        try {

            if (!$file) {
                return false;
            }

            $real = $this->getRoot() . $newFile->getPath();
            $size = filesize($file["tmp_name"]);

            $context = Array(
                "max_size" => 5000000000 // 5Go
            );
            $errors = $uploader->upload($file, $real, $context);

            $newFile->setSize($size);

            $this->encode($this->getRoot() . $newFile->getPath(), $newFile->getLastVersion($this->doctrine)->getKey(), $newFile->getLastVersion($this->doctrine)->getMode());

            $this->setRawContent($newFile, null, false, $user);

            if (count($errors["errors"]) > 0) {
                $this->delete($newFile);
                return false;
            }

        } catch (\Exception $e) {
            $newFile->setPreviewHasBeenGenerated(true);
            $newFile->setHasPreview(false);
        }

        if ($this->preview->isImage($newFile->getExtension())) {
            $this->genPreview($newFile);
            $newFile->setPreviewHasBeenGenerated(true);
            $newFile->setHasPreview(true);
            $this->doctrine->persist($newFile);
            $this->doctrine->flush();
        }

        $this->doctrine->flush($newFile);


        return $newFile;

    }

    public function recursZip($workspace, &$zip, $directory, $prefix, $working_dir)
    {
        if ($prefix != "") {
            $zip->addEmptyDir($prefix);
        }
        if (is_array($directory)) {
            $children = $directory;
        } else
            if ($directory == null) {
                $children = $this->listDirectory($workspace->getId(), null, false);
            } else {
                $children = $this->listDirectory($workspace->getId(), $directory->getId(), false);
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
                $realFile = $this->decode($completePath, $child->getLastVersion($this->doctrine)->getKey(), $child->getLastVersion($this->doctrine)->getMode());

                rename($realFile, $working_dir . "/" . basename($realFile));

                $zip->addFile($working_dir . "/" . basename($realFile), $prefix . $filename);
            }
        }
    }

    public function generateZip($workspace, $elements)
    {
        ignore_user_abort(true);

        $zip = new ZipArchive;
        $name = bin2hex(random_bytes(16));
        $tmpPath = $this->getRoot() . "/tmp/" . $name . ".zip";

        foreach ($elements as $element) {

            if (!$this->isWorkspaceAllowed($workspace, $element)) {
                @unlink($tmpPath);
                return false;
            }

        }


        if ($zip->open($tmpPath, ZipArchive::CREATE) === TRUE) {

            $working_dir = $this->getRoot() . "/tmp/" . $name;
            mkdir($working_dir);

            $this->recursZip($workspace, $zip, $elements, "", $working_dir);
            $zip->close();

            $cdir = scandir($working_dir);
            foreach ($cdir as $key => $value) {
                if (!in_array($value, array(".", ".."))) {
                    @unlink($working_dir . "/" . $value);
                }
            }
            @rmdir($working_dir);

            if (connection_aborted()) {
                @unlink($tmpPath);
                return;
            }
        }

        return $tmpPath;

    }

    public function download($workspace, $file, $download, $versionId=0)
    {


        if (isset($_SERVER['HTTP_ORIGIN'])) {
            header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        }
        header('Access-Control-Allow-Credentials: true');

        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");

        if (!$workspace) {
            return;
        }

        $files = false;
        if (is_array($file)) {
            $files = [];
            foreach ($file as $file_id) {
                if ($file_id) {
                    $a_file = $this->convertToEntity($file_id, "TwakeDriveBundle:DriveFile");

                    if ($a_file) {

                        if (!$this->isWorkspaceAllowed($workspace, $a_file)) {
                            return false;
                        }

                        $files[] = $a_file;

                    }
                }
            }

            if (count($files) == 1) {
                $file = $files[0];
                $files = false;
            }
        } else {

            if (!$file || $file == "root") {
                $file = $this->getRootEntity($workspace->getId());
            } else {
                $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");
            }

            if (!$file) {
                return false;
            }

            if (!$this->isWorkspaceAllowed($workspace, $file)) {
                return false;
            }
        }

        //Directory : download as zip
        if ($files || $file == null || $file->getIsDirectory()) { //Directory or root


            if ($files) {

                $zip_path = $this->generateZip($workspace, $files);

                $archive_name = count($files) . " files from " . $workspace->getName();

            } else {
                if ($file->getSize() > 1000000000) //1Go is too large
                {
                    return false;
                }

                $zip_path = $this->generateZip($workspace, [$file]);

                $archive_name = ($file ? $file->getName() : "Documents");
            }

            if (!$zip_path) {
                return false;
            }

            header('Content-Type: application/octet-stream');
            header("Content-type: application/force-download");
            header('Content-Disposition: attachment; filename="' . $archive_name . ".zip" . '"');

            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . $this->filesize($zip_path));

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

            /* @var DriveFile $file*/
            if($versionId!=0){
                $version = $this->convertToEntity($versionId,"TwakeDriveBundle:DriveFileVersion");
                $file->setLastVersionId($version->getId());
                $file->setName(date("Y-m-d_h:i", $version->getDateAdded()->getTimestamp()) . "_" . $version->getFileName());
            }

            $completePath = $this->getRoot() . $file->getPath();

            ini_set('memory_limit', '10M');

            $completePath = $this->decode($completePath, $file->getLastVersion($this->doctrine)->getKey(), $file->getLastVersion($this->doctrine)->getMode());


            //TODO
            //$ext = $this->getInfos(null, $file, true)['extension'];

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
            header('Content-Length: ' . $this->filesize($completePath));

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

    protected function verifyPath($path)
    {
        $path = dirname($path);
        if (!$this->file_exists($path, null)) {
            mkdir($path, 0777, true);
        }
    }

    protected function encode($path, $key, $mode = "AES")
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

    protected function decode($path, $key, $mode = "AES")
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

    protected function writeEncode($path, $key, $content, $mode = "AES")
    {
        file_put_contents($path, $content);
        if ($content != "") {
            $this->encode($path, $key, $mode);
        }
    }

    protected function readDecode($path, $key, $mode = "AES")
    {
        $path = $this->decode($path, $key, $mode);
        $var = file_get_contents($path);
        @unlink($path);
        return $var;
    }

    protected function read($path)
    {
        $var = file_get_contents($path);
        return $var;
    }

    public function autoGenPreview(){
        $start = microtime(true);
        $time_elapsed_secs = 0;

        while ($time_elapsed_secs < 60) {
            /* @var DriveFile $file */
            $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("previewhasbeengenerated" => false), Array(), 50);
            foreach ($files as $file) {
                if ($file->getSize() > 10) {

                    $file->setPreviewHasBeenGenerated(true);

                    $res = $this->genPreview($file);
                    if ($res) {
                        $file->setHasPreview(true);
                    }

                    $this->doctrine->persist($file);
                    $this->doctrine->flush();

                    $this->pusher->push(Array("action" => "update"), "drive/" . $file->getWorkspaceId());

                }

            }
            $this->doctrine->clear();
            sleep(1);

            $time_elapsed_secs = microtime(true) - $start;
        }
        return true;
    }

    public function genPreview(DriveFile $file)
    {
        $res = false;

        if (!$file->getIsDirectory() && $file->getLastVersion($this->doctrine)) {

            error_log("will generate preview");

            $path = $this->getRoot() . "/" . $file->getPath();
            $previewPath = $this->getRoot() . "/" . $file->getPreviewPath();

            $this->verifyPath($previewPath);

            $ext = $file->getExtension();
            $tmppath = $this->decode($path, $file->getLastVersion($this->doctrine)->getKey(), $file->getLastVersion($this->doctrine)->getMode());

            if ($tmppath) {
                rename($tmppath, $tmppath . ".tw");
                $tmppath = $tmppath . ".tw";

                try {
                    $res = $this->preview->generatePreview(basename($path), $tmppath, dirname($path), $ext, $file);
                    if ($this->file_exists($path . ".png", null)) {
                        rename($path . ".png", $previewPath);
                        $res = true;
                    } else {
                        error_log("FILE NOT GENERATED !");
                        $res = false;
                    }
                } catch (\Exception $e) {

                }

                @unlink($tmppath);

            }

        }

        return $res;

    }


    //Used to show content of a drive folder since now other group can see others content
    public function isWorkspaceAllowed($workspaceId, $directoryId)
    {
        if ($directoryId == null) {
            return true;
        }
        $driveRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $workspace = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");

        if (!$workspace) {
            return false;
        }

        $dir = $this->convertToEntity($directoryId, "TwakeDriveBundle:DriveFile");

        if ($dir->getDetachedFile()) {
            return true;
        }

        while ($dir != null) {
            //If it's mine
            if ($workspace->getId() == $dir->getWorkspaceId()) {
                return true;
            }
            //if it's shared..
            if ($dir->getShared()) {

                //to me
                $directoryaccess = $driveRepository->findOneBy(Array("group" => $workspace, "copyof" => $dir));
                if ($directoryaccess) {
                    return true;
                }
            }
            //we go upward to see if a parent is shared to us
            $dir = $dir->getParentId();
        }
        return false;
    }

    protected function updateLabelsCount($workspace, $flush = true)
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

        $listFiles = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(array('default_web_app' => $app, 'group' => $workspace_id, 'isInTrash' => false), array('opening_rate' => 'desc'), 20);
        return $listFiles;
    }

    public function changeDefaultWebApp($file, $newApp){
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");
        /* @var DriveFile $file */
        $newApp = $this->convertToEntity($newApp, "TwakeMarketBundle:Application");
        if(!$file || ! $newApp)
            return null;
        if(!$newApp->getUrlApp() || $file->getIsDirectory() || $file->getUrl()==null)
            return false;

        $file->setDefaultWebApp($newApp);

        $this->doctrine->persist($file);
        $this->doctrine->flush();

        $datatopush = Array(
            "type" => "CHANGE_WORKSPACE_EXTERNAL_FILES",
            "data" => Array(
                "workspaceId" => $file->getWorkspaceId(),
            )
        );
        $this->pusher->push($datatopush, "group/" . $file->getWorkspaceId());

        return true;
    }

    protected function file_exists($path, $file = null)
    {
        return file_exists($path);
    }

    protected function filesize($path, $file = null)
    {
        return filesize($path);
    }

}
