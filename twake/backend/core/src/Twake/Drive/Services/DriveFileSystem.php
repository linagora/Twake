<?php


namespace Twake\Drive\Services;

use App\App;
use Twake\Core\CommonObjects\AttachementManager;
use Twake\Drive\Entity\DriveFile;
use Twake\Drive\Entity\DriveFileVersion;

class DriveFileSystem
{

    public function __construct(App $app)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
        $this->applications_api = $app->getServices()->get("app.applications_api");
        $this->drive_resumable = false;
        $this->ws = $app->getServices()->get("app.websockets");
        $this->access_manager = $app->getServices()->get("app.accessmanager");
        $this->attachementManager = new AttachementManager($this->em, $this->ws);
    }

    function setDriveResumable($drive_resumable)
    {
        $this->drive_resumable = $drive_resumable;
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        $route = explode("/", $route);

        if (count($route) < 3) {
            return false;
        }

        $workspace_id = $route[1];
        $document_id = $route[2];

        if (!$workspace_id || (!empty($data["get_options"]["workspace_id"]) && $workspace_id != $data["get_options"]["workspace_id"])) {
            return false;
        }

        if (!$document_id || $document_id == "undefined") {
            $document_id = $this->getRootEntity($workspace_id)->getId();
        }

        return $this->hasAccess([
            "id" => $document_id,
            "workspace_id" => $workspace_id,
            "public_access_token" => $data["get_options"]["public_access_token"]
        ], $current_user);

    }

    public function hasAccess($data, $current_user = null)
    {
        if ($current_user === null) {
            return true;
        }
        if (!is_string($current_user)) {
            $current_user = $current_user->getId();
        }
        return $this->access_manager->has_access($current_user, Array(
            "type" => "DriveFile",
            "edition" => true,
            "object_id" => empty($data["id"]) ? (isset($data["parent_id"]) ? $data["parent_id"] : null) : $data["id"],
            "workspace_id" => isset($data["workspace_id"]) ? $data["workspace_id"] : null
        ), ["token" => @$data["public_access_token"]]);
    }

    public function get($options, $current_user)
    {
        $options["id"] = $options["directory_id"];
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $directory_id = $options["directory_id"];
        $workspace_id = $options["workspace_id"];
        $trash = $options["trash"];

        if (!$directory_id) {
            $directory_id = "root";
        }

        $elements = $this->listDirectory($workspace_id, $directory_id, $trash);
        $path = $this->getPath($workspace_id, $directory_id);


        $list = Array();
        foreach ($elements as $element) {
            $array = $element->getAsArray();
            $array["path"] = $path;
            $array["versions"] = $this->getFileVersion($element, true);

            $list[] = $array;
        }
        return $list;

    }

    public function listDirectory($workspaceId, $directoryId, $trash = false)
    {

        if (!$workspaceId) {
            return false;
        }

        $repo = $this->em->getRepository("Twake\Drive:DriveFile");
        $root = $this->getRootEntity($workspaceId);

        if (!$directoryId || $directoryId == "root") {
            $directoryId = $root->getId();
        }

        if ($directoryId == $root->getId()) {
            if ($trash) {
                $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $this->getTrashEntity($workspaceId)->getId() . ""));
            } else {
                $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $root->getId()));
            }
        } else {
            $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $directoryId));
        }

        return $list;
    }

    public function getRootEntity($workspace_id)
    {
        $root = $this->em->getRepository("Twake\Drive:DriveFile")
            ->findOneBy(Array("workspace_id" => $workspace_id . "", "isintrash" => false, "parent_id" => ""));
        if (!$root) {
            $root = new DriveFile($workspace_id, "", true);
            $this->em->persist($root);
            $this->em->flush();
        }
        return $root;
    }

    public function getTrashEntity($workspace_id)
    {
        $trash = $this->em->getRepository("Twake\Drive:DriveFile")
            ->findOneBy(Array("workspace_id" => $workspace_id . "", "parent_id" => "trash"));

        if (!$trash) {
            $trash = new DriveFile($workspace_id, "trash", true);
            $trash->setParentId("trash");
            $this->em->persist($trash);
            $this->em->flush();
        }

        return $trash;
    }

    public function getPath($workspace_id, $directory_id)
    {

        $repo = $this->em->getRepository("Twake\Drive:DriveFile");

        if ($directory_id == "root" || $directory_id == "trash") {
            $child = $this->getRootEntity($workspace_id);
            return [$child->getAsArray()];
        } else {
            $child = $repo->findOneBy(Array("id" => $directory_id));
        }

        if (!$child) {
            return [];
        }

        $list = [$child->getAsArray()];

        $iter = 0;
        while ($child && $child->getParentId() && $child->getParentId() != "root" && $child->getParentId() != "trash" && $iter < 100) {
            $iter++;
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

    public function getFileVersion($fileOrFileId, $asArray = false)
    {
        if (!is_object($fileOrFileId)) {
            $file = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $fileOrFileId));
        } else {
            $file = $fileOrFileId;
        }
        if (!$file || $file->getIsDirectory()) {
            return false;
        }
        $versionsEntity = $this->em->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $file->getId()));
        if ($asArray) {
            $versions = Array();
            foreach ($versionsEntity as $version) {
                $versions[] = $version->getAsArray();
            }
            return $versions;
        }
        return $versionsEntity;
    }

    public function find($options, $current_user)
    {
        $element_id = $options["element_id"];
        $workspace_id = $options["workspace_id"];

        if (!$element_id) {
            $element_id = "root";
        }

        $options["id"] = $element_id;
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if ($element_id == "root") {
            $element = $this->getRootEntity($workspace_id);
        } else if ($element_id == "trash") {
            $element = $this->getTrashEntity($workspace_id);
        } else {
            $element = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $element_id));
        }

        $data = $element;

        if (!$data) {
            return null;
        }

        if (!$data->getDetachedFile() && $element->getParentId() && $element->getParentId() != "trash") {
            $path = $this->getPath($workspace_id, $element_id);
        } else {
            $path = [$data->getAsArray()];
        }

        $versions = $this->em->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $element->getId()));
        $file_version = [];
        foreach ($versions as $version) {
            $file_version[] = $version->getAsArray();
        }
        $data = $data->getAsArray();
        $data["path"] = $path;
        $data["versions"] = $file_version;

        return $data;

    }

    public function remove($object, $options, $current_user = null, $return_entity = false)
    {
        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }
        if (isset($object["id"])) { // on recoit un identifiant donc on supprime un drive file
            $fileordirectory = $this->em->getRepository("Twake\Drive:DriveFile")
                ->findOneBy(Array("id" => $object["id"]));
            if ($fileordirectory && $fileordirectory->getParentId() && $fileordirectory->getParentId() != "trash") {
                //on change la taille de tous les dossiers parent a celui ci
                if ($fileordirectory->getIsInTrash()) {
                    //on delete definitevement de la corbeille donc on modifie pas la racine
                    $this->updateSize($fileordirectory->getParentId(), -$fileordirectory->getSize(), 2);
                } else {
                    $this->updateSize($fileordirectory->getParentId(), -$fileordirectory->getSize(), 0);
                }

                if ($fileordirectory->getIsDirectory()) {
                    $fileson = $this->em->getRepository("Twake\Drive:DriveFile")
                        ->findBy(Array("workspace_id" => $fileordirectory->getWorkspaceId() . "", "parent_id" => $object["id"] . ""));
                    if (isset($fileson)) {
                        foreach ($fileson as $file) {
                            $this->recursedelete($file);
                        }
                    }
                }
                $this->em->remove($fileordirectory);
                $this->em->flush();

                $this->notifyConnectors($fileordirectory, "remove", $current_user);

            } else {
                return false;
            }
        }

        if ($return_entity) {
            return $fileordirectory;
        }
        return $fileordirectory->getAsArray();
    }

    protected function updateSize($directory, $delta, $to_or_out_trash) // on passe l'id du directory
    {

        $workspace_id = null;

        $iter = 0;

        while ($directory != null && $iter < 100) {

            $iter++;

            if ($directory == "root" || $directory == "trash" || $directory == "removed_trashes") {
                if (!$workspace_id) {
                    return;
                }
                $directory = $this->getRootEntity($workspace_id);
            }
            if (is_string($directory)) {
                $directory = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $directory . ""));

                if (!$workspace_id) {
                    $workspace_id = $directory->getWorkspaceId();
                }

            }
            if (!$directory) {
                $directory = null;

            }

            if ($directory != null) {
                if (!($directory->getParentId() == "" && (($to_or_out_trash === 1 && $delta > 0) || ($to_or_out_trash === 2 && $delta < 0)))) {
                    $currentSize = $directory->getSize();
                    $directory->setSize($currentSize + $delta);
                    $this->em->persist($directory);
                    $this->em->flush();
                }

                $directory = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $directory->getId() . ""));
                $directory = $directory->getParentId();
            }
        }
    }

    public function recursedelete($directory)
    {
        if ($directory->getIsDirectory()) {
            $fileson = $this->em->getRepository("Twake\Drive:DriveFile")->findBy(Array("workspace_id" => $directory->getWorkspaceId() . "", "parent_id" => $directory->getId() . ""));
            if (isset($fileson)) {
                foreach ($fileson as $file) {
                    $this->recursedelete($file);
                }
            }
        }
        $this->em->remove($directory);
        $this->em->flush();
    }

    private function notifyConnectors(DriveFile $file, $did_create = true, $current_user = null)
    {

        if ($file->getDetachedFile()) {
            return;
        }

        $workspace_id = $file->getWorkspaceId();
        $workspace = $this->em->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspace_id));

        $notification_data = Array(
            "group" => $workspace->getGroup()->getAsArray(),
            "workspace" => $workspace->getAsArray(),
            "file" => $file->getAsArray(),
            "user" => $current_user
        );

        if ($did_create === "remove") {
            $hook_name = "remove_file";
        } else if ($did_create) {
            $hook_name = "new_file";
        } else {
            $hook_name = "edit_file";
        }

        $application_notified = [];

        //Look if this file is in application directory
        $child = $file;
        $repo = $this->em->getRepository("Twake\Drive:DriveFile");
        $iter = 0;
        while ($child && $child->getParentId() && $child->getParentId() != "root" && $child->getParentId() != "trash" && $iter < 100) {
            $iter++;

            $parent_id = null;
            if ($child->getIsInTrash()) {
                $parent_id = $child->getOldParent();
            }

            if (!$parent_id) {
                $parent_id = $child->getParentId();
            }

            $parent = $repo->findOneBy(Array("id" => $parent_id));
            if ($parent) {

                if ($parent->getApplicationId() && $parent->getExternalStorage()) {

                    $notification_data["external_storage_root"] = $parent->getAsArray();

                    if (!in_array($parent->getApplicationId(), $application_notified)) {
                        $application_notified[] = $parent->getApplicationId();
                        $this->applications_api->notifyApp($parent->getApplicationId(), "hook", $hook_name, $notification_data);
                    }

                    //Do not continue while because we found our app container
                    break;
                }

                $child = $parent;
            } else {
                $child = null;
            }
        }

        //Notify all connectors with access to drive
        $resources = [];
        $resources = array_merge($resources, $this->applications_api->getResources($workspace_id, "workspace_drive", $workspace_id));
        $apps_ids = [];
        foreach ($resources as $resource) {
            if (in_array("file", $resource->getApplicationHooks())) {
                $apps_ids[] = $resource->getApplicationId();
            }
        }
        if (count($apps_ids) > 0) {
            foreach ($apps_ids as $app_id) {
                if ($app_id) {
                    if (!in_array($app_id, $application_notified)) {
                        $application_notified[] = $app_id;
                        $this->applications_api->notifyApp($app_id, "hook", $hook_name, $notification_data);
                    }
                }
            }
        }

    }

    public function save($object, $options, $current_user = null, $upload_data = Array(), $return_entity = false)
    {

        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $application = isset($options["application_id"]) ? $options["application_id"] : false;

        $did_create = false;
        $fileordirectory = null;
        if (isset($object["id"]) && $object["id"]) { // on recoit un identifiant donc c'est un modification
            $fileordirectory = $this->em->getRepository("Twake\Drive:DriveFile")
                ->findOneBy(Array("id" => $object["id"] . ""));
            if (!$fileordirectory) {
                return false;
            }

            $fileordirectory->setLastModified();

        } else { // pas d'identifiant on veut donc créer un fichier
            if (!isset($object["workspace_id"])) {
                return false;
            }
            $front_id = $object["front_id"];
            $workspace_id = $object["workspace_id"];
            $fileordirectory = new DriveFile($workspace_id, "defined_later", $object["is_directory"]);
            $fileordirectory->setFrontId($front_id);
            $fileordirectory->setCreator($current_user);
            $fileordirectory->setPreviewHasBeenGenerated(false);
            $fileordirectory->setHasPreview(false);
            if (isset($object["detached"]) && $object["detached"]) {
                $fileordirectory->setDetachedFile(true);
                $parent_id = "detached";
            }

            $did_create = true;
        }

        //Trying to modify trash or root folders
        if ($fileordirectory->getParentId() == "trash" || (!$fileordirectory->getParentId() && !$fileordirectory->getDetachedFile())) {
            return false;
        }

        $did_move = false;
        if (isset($object["parent_id"]) && $object["parent_id"] != "" && $object["parent_id"] != $fileordirectory->getParentId() . "") {
            $parent_id = $object["parent_id"] . "";
            $did_move = true;

            if ($did_create) { // on set le fichier avec le bon parent
                $file_parent = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $object["parent_id"] . ""));
                if ($file_parent == null) {
                    return false;
                }
            } else { // on a un parent ce n'est pas une creation c'est un déplacement
                $fileordirectory_parent_id = $fileordirectory->getParentId() . "";
                if ($fileordirectory_parent_id != $parent_id) { //changement de parent id donc le fichier a été déplacé.
                    $this->move($fileordirectory, $fileordirectory_parent_id, $parent_id, $current_user);
                }
            }
        } else {
            if (!isset($object["detached"]) && $did_create) {
                $parent_id = $this->getRootEntity($workspace_id)->getId();
            }
        }
        if (isset($parent_id)) {
            $fileordirectory->setParentId($parent_id);
        }

        if (isset($object["trash"]) && $object["trash"] && !$did_create && !$fileordirectory->getIsInTrash()) { // on veut mettre un fichier a la corbeille
            $oldparent = $fileordirectory->getParentId() . "";
            $newparent = $this->getTrashEntity($fileordirectory->getWorkspaceId() . "")->getId() . "";
            $this->move($fileordirectory, $oldparent, $newparent, 1, $current_user);

            $fileordirectory->setOldParent($oldparent);


            $this->recursetrash($fileordirectory);


        } elseif (isset($object["trash"]) && !$object["trash"] && !$did_create && $fileordirectory->getIsInTrash()) { //on veut restaurer un fichier de la corbeille sur son ancien parent
            $oldparent = $fileordirectory->getParentId() . "";
            $newparent = $fileordirectory->getOldParent() . "";
            $parenttrash = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $oldparent));
            if ($parenttrash->getIsInTrash() && $newparent === "") { // Si le parent est a la corbeille également on va le mettre a la racine du workspace
                $newparent = $this->getRootEntity($fileordirectory->getWorkspaceId() . "")->getId() . "";
            }
            $this->move($fileordirectory, $oldparent, $newparent, 2, $current_user);

            $fileordirectory->setOldParent("");
            $this->recursetrash($fileordirectory);

        }


        $name_changed = false;
        if (isset($object["name"]) && $object["name"] != $fileordirectory->getName()) {
            $name_changed = true;
            $fileordirectory->setName($object["name"]);
        }

        if (($name_changed || $did_create || $did_move) && !$fileordirectory->getIsInTrash()) {

            $repo = $this->em->getRepository("Twake\Drive:DriveFile");
            $list = $repo->findBy(Array("workspace_id" => $fileordirectory->getWorkspaceId(), "parent_id" => $fileordirectory->getParentId(), "isintrash" => false));

            $present = true;
            $iter = 0;
            while ($present == true && $iter < 100) {
                $iter++;

                $second_present = false;
                foreach ($list as $el) {
                    if ($el->getName() == $fileordirectory->getName() && $el->getId() != $fileordirectory->getId()) {
                        $second_present = true;
                    }
                }
                if (!$second_present) {
                    $present = false;
                } else {
                    $present = true;

                    preg_match("/(.*)(\.[a-zA-Z0-9]+)+$/i", $fileordirectory->getName(), $matches);
                    $name = isset($matches[1]) ? $matches[1] : "";
                    $ext = isset($matches[2]) ? $matches[2] : "";
                    if (!$ext) {
                        $name = $fileordirectory->getName();
                        $ext = "";
                    }
                    preg_match("/-([0-9]+)$/i", $name, $matches);
                    $cur_val = intval(isset($matches[1]) ? $matches[1] : 0);
                    $cur_val_to_replace = isset($matches[0]) ? $matches[0] : "";

                    if ($iter >= 100) {
                        $new_name = substr($name, 0, strlen($name) - strlen($cur_val_to_replace)) . "-" . date("U") . $ext;
                    } else {
                        $new_name = substr($name, 0, strlen($name) - strlen($cur_val_to_replace)) . "-" . ($cur_val + 1) . $ext;
                    }

                    $fileordirectory->setName($new_name);

                }
            }

        }

        if ($application && $object["preview_link"]) {
            $fileordirectory->setHasPreview(true);
            $fileordirectory->setPreviewHasBeenGenerated(true);
            $fileordirectory->setPreviewLink($object["preview_link"]);
        }

        if (isset($object["hidden_data"])) {
            $fileordirectory->setHiddenData($object["hidden_data"]);
        }

        if ($application && isset($object["last_modification_token"])) {
            $fileordirectory->setLastModificationToken($object["last_modification_token"]);
        } else {
            $fileordirectory->setLastModificationToken(date("U") . "-" . md5(random_bytes(20)));
        }

        if (isset($object["application_id"])) {
            $fileordirectory->setApplicationId($object["application_id"]);
            if (isset($object["external_storage"])) {
                $fileordirectory->setExternalStorage($object["external_storage"]);
            }
        }

        if (isset($object["url"])) {
            $fileordirectory->setUrl($object["url"]);
        }

        if (isset($object["tags"])) {
            $fileordirectory->setTags($object["tags"]);
        }
        if (isset($object["attachments"]) || $did_create) {
            $this->attachementManager->updateAttachements($fileordirectory, isset($object["attachments"]) ? $object["attachments"] : Array());
        }


        $fileordirectory->setLastUser($current_user);


        if (isset($fileordirectory)) {
            $fileordirectory->setEsIndex(false);
            $this->em->persist($fileordirectory);
            $this->em->flush();
        }


        if (isset($object["_once_new_version"])) {
            $new = $object["_once_new_version"];
        } else {
            $new = false;
        }
        //Update size if file was created AFTER versionning
        if (!$fileordirectory->getIsDirectory() && $upload_data) {
            $size_before = $fileordirectory->getSize();

            $this->versionning($fileordirectory, $current_user, $upload_data, $new);
            $size_after = $upload_data["size"];

            if ($size_after - $size_before != 0) {
                if ($fileordirectory->getDetachedFile()) {
                    $fileordirectory->setSize($size_after);
                } else {
                    $this->updateSize($fileordirectory->getId() . "", $size_after - $size_before, false);
                }
            }
        }

        $this->notifyConnectors($fileordirectory, $did_create, $current_user);

        if ($return_entity) {
            return $fileordirectory;
        }
        return $fileordirectory->getAsArray();
    }

    public function move($fileordirectory, $oldparent, $newparent, $to_or_out_trash = 0, $current_user = null)
    {
        $this->em->remove($fileordirectory);
        $this->em->flush();
        $fileordirectory->setParentId($newparent);
        $size = $fileordirectory->getSize();
        if ($fileordirectory->getDetachedFile() == false) {
            //on doit modifer la taille recursivement de l'ancien dossier parent
            $this->updateSize($oldparent, -$size, $to_or_out_trash);
            $trashcheck = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $newparent . ""));
            if (isset($trashcheck) && $trashcheck->getIsInTrash()) { // si on deplace un fichier sur un autre qui est présent a la corbeille mais sans passer par la mise a la corbeille
                $to_or_out_trash = 1;
                $fileordirectory->setOldParent($oldparent);
                //$fileordirectory->setIsInTrash(true);
                $this->recursetrash($fileordirectory);
            }
        } else {
            $fileordirectory->setDetachedFile(false);
        }
        $this->updateSize($newparent, $size, $to_or_out_trash);

    }

    public function recursetrash($directory)
    { // permet de changer tous les in trash d'une arborescence

        $fileson = $this->em->getRepository("Twake\Drive:DriveFile")->findBy(Array("workspace_id" => $directory->getWorkspaceId() . "", "parent_id" => $directory->getId() . ""));
        if (isset($fileson)) {
            foreach ($fileson as $file) {
                $this->recursetrash($file);
            }
        }
        $file = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $directory->getId()));
        if (isset($file)) {
            $this->em->remove($file);
            $this->em->flush();
        }
        $directory->setIsInTrash(!($directory->getIsInTrash()));
        $this->em->persist($directory);
        $this->em->flush();
    }

    public function versionning($fileordirectory, $current_user, $upload_data = null, $create_new_version = false)
    {

        //on recupere la derniere version pour le fichier en cours
        $last_version = null;
        if ($fileordirectory->getLastVersionId()) {
            $last_version = $this->em->getRepository("Twake\Drive:DriveFileVersion")->findOneBy(Array("id" => $fileordirectory->getLastVersionId()));
        }

        if ($last_version && !$create_new_version && count($last_version->getData()) > 0 && $this->drive_resumable) {
            //In this case we must remove what we have on storage !
            $this->drive_resumable->removeFromStorage($last_version->getData());
        }

        if (!$last_version || $create_new_version) { // on crée une nouvelle version pour le fichier en question
            $last_version = new DriveFileVersion($fileordirectory, $current_user);
        }

        $last_version->setData(isset($upload_data["data"]) ? $upload_data["data"] : Array());
        $last_version->setSize(isset($upload_data["size"]) ? $upload_data["size"] : 0);

        $this->em->persist($last_version);
        $this->em->flush();

        $fileordirectory->setLastVersionId($last_version->getId());
        $this->em->persist($fileordirectory);
        $this->em->flush();

    }

    public function set_file_access($file_id, $has_public_acess = false, $is_editable = false, $authorized_members = Array(), $authorized_channels = Array(), $current_user = null)
    {
        if ($current_user) {

            $df = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $file_id));
            //on cree la liste des personnes autorizé;
            if (strlen($df->getPublicAccessKey()) > 10) {
                $token = $df->getPublicAccessKey();
            } else {
                $token = sha1(bin2hex(random_bytes(120)));
                $df->setPublicAccessKey($token);
            }

            if (!$has_public_acess) {
                $df->setPublicAccessKey("");
            }

            $jsondata = Array(
                "token" => $has_public_acess ? $token : "",
                "authorized_members" => $authorized_members,
                "authorized_channels" => $authorized_channels,
                "is_editable" => $is_editable);
            $df->setAccesInfo($jsondata);
            $this->em->persist($df);
            $this->em->flush();

            return $df->getAsArray();

        }
    }

    public function reset_file_access($file_id, $current_user = null)
    {
        if ($current_user) {

            $df = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $file_id));
            $df->setPublicAccessKey("");
            $jsondata = Array(
                "token" => "",
                "authorized_members" => Array(),
                "authorized_channels" => Array(),
                "is_editable" => false
            );
            $df->setAccesInfo($jsondata);
            $this->em->persist($df);
            $this->em->flush();

            return $df;

        }
    }

    public function emptyTrash($workspace_id, $current_user)
    {

        $trash = $this->getTrashEntity($workspace_id);
        $this->updateSize($this->getRootEntity($workspace_id), -$trash->getSize(), 2);

        //We have just to rename the trash, we are not really deleting it
        $this->em->remove($trash);
        $this->em->flush();

        $trash->setParentId("removed_trashes");
        $trash->setName("removed_trash_" . date("U"));
        $this->em->persist($trash);
        $this->em->flush();

        //Regenerate new trash
        $new_trash = $this->getTrashEntity($workspace_id);

        return $new_trash->getAsArray();

    }

    public function open($file_id)
    {
        $file = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $file_id));
        if ($file != null) {
            $file->setOpeningRate($file->getOpeningRate() + 1);
            $this->em->persist($file);
            $this->em->flush();
            return true;
        }

        return false;
    }

}
