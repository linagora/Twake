<?php


namespace WebsiteApi\DriveBundle\Services;


use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;

class DriveFileRefacto
{

    function __construct($entity_manager, $drive_file_system_selector, $uploader, $application_api)
    {
        $this->em = $entity_manager;
        $this->dfs = $drive_file_system_selector->getFileSystem();
        $this->uploader = $uploader;
        $this->applications_api = $application_api;
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in CoreBundle/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        //TODO
        return true;
    }

    public function hasAccess($data, $current_user = null, $drive_element = null)
    {
        return true;
    }

    public function get($options, $current_user)
    {
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
            $list[] = $array;
        }
        return $list;

    }

    public function find($options, $current_user)
    {
        $element_id = $options["element_id"];
        $workspace_id = $options["workspace_id"];

        if (!$element_id) {
            $element_id = "root";
        }

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if ($element_id == "root") {
            $element = $this->getRootEntity($workspace_id);
        } else if ($element_id == "trash") {
            $element = $this->getTrashEntity($workspace_id);
        } else {
            $element = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $element_id));
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

        $data = $data->getAsArray();
        $data["path"] = $path;

        return $data;

    }

    public function recursedelete($directory){
        //error_log(print_r($directory->getId(),true));
        if($directory->getIsDirectory()){
            $fileson = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $directory->getWorkspaceId() . "", "parent_id" => $directory->getId() . ""));
            if (isset($fileson)) {
                foreach ($fileson as $file) {
                    $this->recursedelete($file);
                }
            }
        }
        $this->em->remove($directory);
        $this->em->flush();
    }

    public function remove($object, $options, $current_user = null, $return_entity = false)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }
        if(isset($object["id"])) { // on recoit un identifiant donc on supprime un drive file
            $fileordirectory = $this->em->getRepository("TwakeDriveBundle:DriveFile")
                ->findOneBy(Array("id" => $object["id"]));
            if($fileordirectory){
                //on change la taille de tous les dossiers parent a celui ci
                if($fileordirectory->getIsInTrash()){
                    //on delete definitevement de la corbeille donc on modifie pas la racine
                    $this->updateSize($fileordirectory->getParentId(), -$fileordirectory->getSize(), 2);
                }
                else{
                    $this->updateSize($fileordirectory->getParentId(), -$fileordirectory->getSize(), 0);
                }

                if($fileordirectory->getIsDirectory()){
                    $fileson = $this->em->getRepository("TwakeDriveBundle:DriveFile")
                        ->findBy(Array("workspace_id" => $fileordirectory->getWorkspaceId()."", "parent_id" => $object["id"].""));
                    if(isset($fileson)){
                        foreach ($fileson as $file){
                            $this->recursedelete($file);
                        }
                    }
                }
                $this->em->remove($fileordirectory);
                $this->em->flush();
            }
            else{
                return false;
            }
        }

        if ($return_entity) {
            return $fileordirectory;
        }
        return $fileordirectory->getAsArray();
    }

    public function versionning($fileordirectory, $current_user, $upload_data = null, $create_new_version = false)
    {

        //on recupere la derniere version pour le fichier en cours
        $last_version = null;
        if ($fileordirectory->getLastVersionId()) {
            $last_version = $this->em->getRepository("TwakeDriveBundle:DriveFileVersion")->findOneBy(Array("id" => $fileordirectory->getLastVersionId()));
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

    public function save($object, $options, $current_user = null, $upload_data = Array(), $return_entity = false)
    {

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $did_create = false;
        $fileordirectory = null;
        if (isset($object["id"]) && $object["id"]) { // on recoit un identifiant donc c'est un modification
            $fileordirectory = $this->em->getRepository("TwakeDriveBundle:DriveFile")
                ->findOneBy(Array("id" => $object["id"].""));
            $fileordirectory->setLastModified();
            if(!$fileordirectory){
                return false;
            }
        }
        else{ // pas d'identifiant on veut donc créer un fichier
            if(!isset($object["front_id"]) || !isset($object["workspace_id"])) {
                return false;
            }
            $front_id = $object["front_id"];
            $workspace_id = $object["workspace_id"];
            $fileordirectory = new DriveFile($workspace_id, "defined_later", $object["is_directory"]);
            $fileordirectory->setFrontId($front_id);
            $fileordirectory->setPreviewHasBeenGenerated(false);
            $fileordirectory->setHasPreview(false);
            //$fileordirectory->setIsInTrash(false);
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
            $parent_id = $object["parent_id"]."";
            $did_move = true;

            if($did_create) { // on set le fichier avec le bon parent
                $file_parent = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id"=> $object["parent_id"].""));
                if($file_parent == null){
                    return false;
                }
            }
            else{ // on a un parent ce n'est pas une creation c'est un déplacement
                $fileordirectory_parent_id = $fileordirectory->getParentId()."";
                if ($fileordirectory_parent_id != $parent_id) { //changement de parent id donc le fichier a été déplacé.7
                    $this->move($fileordirectory, $fileordirectory_parent_id, $parent_id);
                }
            }
        }
        else{
            if (!isset($object["detached"]) && $did_create) {
                $parent_id = $this->getRootEntity($workspace_id)->getId();
            }
        }
        if(isset($parent_id)) {
            $fileordirectory->setParentId($parent_id);
        }

        if (isset($object["trash"]) && $object["trash"] && !$did_create && !$fileordirectory->getIsInTrash()) { // on veut mettre un fichier a la corbeille
            $oldparent = $fileordirectory->getParentId() . "";
            $newparent = $this->getTrashEntity($fileordirectory->getWorkspaceId() . "")->getId() . "";
            //error_log(print_r("new parent id: " . $newparent,true));
            $this->move($fileordirectory, $oldparent, $newparent, 1);

            $fileordirectory->setOldParent($oldparent);


            $this->recursetrash($fileordirectory);


        } elseif (isset($object["trash"]) && !$object["trash"] && !$did_create && $fileordirectory->getIsInTrash()) { //on veut restaurer un fichier de la corbeille sur son ancien parent
            $oldparent = $fileordirectory->getParentId() . "";
            $newparent = $fileordirectory->getOldParent() . "";
            $parenttrash = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $oldparent));
            if ($parenttrash->getIsInTrash() && $newparent === "") { // Si le parent est a la corbeille également on va le mettre a la racine du workspace
                $newparent = $this->getRootEntity($fileordirectory->getWorkspaceId() . "")->getId() . "";
            }
            $this->move($fileordirectory, $oldparent, $newparent, 2);

            $fileordirectory->setOldParent("");
            $this->recursetrash($fileordirectory);

        }


        $name_changed = false;
        if (isset($object["name"]) && $object["name"] != $fileordirectory->getName()) {
            $name_changed = true;
            $fileordirectory->setName($object["name"]);
        }

        if (($name_changed || $did_create || $did_move) && !$fileordirectory->getIsInTrash()) {

            $repo = $this->em->getRepository("TwakeDriveBundle:DriveFile");
            $list = $repo->findBy(Array("workspace_id" => $fileordirectory->getWorkspaceId(), "parent_id" => $fileordirectory->getParentId(), "isintrash" => false));

            $present = true;
            while ($present == true) {
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
                    preg_match("/-([0-9]+)$/i", $name, $matches);
                    $cur_val = intval(isset($matches[1]) ? $matches[1] : 0);
                    $cur_val_to_replace = isset($matches[0]) ? $matches[0] : "";
                    $new_name = substr($name, 0, strlen($name) - strlen($cur_val_to_replace)) . "-" . ($cur_val + 1) . $ext;

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

        if (isset($object["application_id"])) {
            $fileordirectory->setApplicationId($object["application_id"]);
        }

        if (isset($object["url"])) {
            $fileordirectory->setUrl($object["url"]);
        }


        $fileordirectory->setLastUser($current_user);


        if(isset($fileordirectory)){
            $this->em->persist($fileordirectory);
            $this->em->flush();
        }


        if (isset($object["_once_new_version"])) {
            $new = $object["_once_new_version"];
        }
        else{
            $new = false;
        }

        //Update size if file was created AFTER versionning
        if (!$fileordirectory->getIsDirectory() && $upload_data) {
            $size_before = $fileordirectory->getSize();
            $this->versionning($fileordirectory, $current_user, $upload_data, $new);
            $size_after = $upload_data["size"];

            if ($size_after - $size_before != 0) {
                if($fileordirectory->getDetachedFile()){
                    $fileordirectory->setSize($size_after);
                }
                else {
                    $this->updateSize($fileordirectory->getId() . "", $size_after - $size_before, false);
                }
            }
        }

        if ($return_entity) {
            return $fileordirectory;
        }
        return $fileordirectory->getAsArray();
    }

    public function recursetrash($directory){ // permet de changer tous les in trash d'une arborescence

        //error_log(print_r($directory->getId(),true));
        $fileson = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $directory->getWorkspaceId()."", "parent_id" => $directory->getId().""));
        if(isset($fileson)){
            foreach ($fileson as $file){
                $this->recursetrash($file);
            }
        }
        $file = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory->getId()));
        if(isset($file)){
            $this->em->remove($file);
            $this->em->flush();
        }
        $directory->setIsInTrash(!($directory->getIsInTrash()));
        $this->em->persist($directory);
        $this->em->flush();
    }

    public function move($fileordirectory, $oldparent, $newparent, $to_or_out_trash = 0)
    {
        $this->em->remove($fileordirectory);
        $this->em->flush();
        $fileordirectory->setParentId($newparent);
        $size = $fileordirectory->getSize();
        if ($fileordirectory->getDetachedFile() == false) {
            //on doit modifer la taille recursivement de l'ancien dossier parent
            $this->updateSize($oldparent, -$size, $to_or_out_trash);
            $trashcheck = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id"=> $newparent.""));
            if(isset($trashcheck) && $trashcheck->getIsInTrash()){ // si on deplace un fichier sur un autre qui est présent a la corbeille mais sans passer par la mise a la corbeille
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

    public function set_file_access($file_id, $has_public_acess = false, $is_editable = false, $authorized_members = Array(), $authorized_channels = Array(), $current_user = null)
    {
        if ($current_user) {

            $df = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $file_id));
            //on cree la liste des personnes autorizé;
            if (strlen($df->getPublicAccessKey()) > 10) {
                $token = $df->getPublicAccessKey();
            } else {
                $token = sha1(bin2hex(random_bytes(20)));
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

            return $df;

        }
    }

    public function reset_file_access($file_id, $current_user = null)
    {
        if ($current_user) {

            $df = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $file_id));
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

    protected function updateSize($directory, $delta, $to_or_out_trash) // on passe l'id du directory
    {

        $workspace_id = null;

        while ($directory != null) {


            if ($directory == "root" || $directory == "trash") {
                if (!$workspace_id) {
                    return;
                }
                $directory = $this->getRootEntity($workspace_id);
            }
            if(is_string($directory)){
                $directory = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory.""));

                if (!$workspace_id) {
                    $workspace_id = $directory->getWorkspaceId();
                }

            }
            if (!$directory ){
                $directory = null;

            }

            if($directory != null){
                if(!($directory->getParentId() == "" && ( ($to_or_out_trash === 1 && $delta > 0) || ($to_or_out_trash === 2 && $delta < 0))) ){
                    $currentSize = $directory->getSize();
                    $directory->setSize($currentSize + $delta);
                    $this->em->persist($directory);
                    $this->em->flush();
                }

                $directory = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory->getId() . ""));
                $directory = $directory->getParentId();
            }
        }
    }

    public function getRootEntity($workspace_id)
    {
        $root = $this->em->getRepository("TwakeDriveBundle:DriveFile")
            ->findOneBy(Array("workspace_id" => $workspace_id."", "isintrash" => false, "parent_id" => ""));
        if (!$root) {
            $root = new DriveFile($workspace_id, "", true);
            $this->em->persist($root);
            $this->em->flush();
        }
        return $root;
    }

    public function getTrashEntity($workspace_id)
    {
        $trash = $this->em->getRepository("TwakeDriveBundle:DriveFile")
            ->findOneBy(Array("workspace_id" => $workspace_id . "", "parent_id" => "trash"));

        if (!$trash) {
            $trash = new DriveFile($workspace_id, "trash", true);
            $trash->setParentId("trash");
            $this->em->persist($trash);
            $this->em->flush();
        }
        return $trash;
    }

    public function listDirectory($workspaceId, $directoryId, $trash = false)
    {

        if (!$workspaceId) {
            return false;
        }

        /*if (!$this->isWorkspaceAllowed($workspaceId, $directoryId)) {
            return false;
        }*/

        $repo = $this->em->getRepository("TwakeDriveBundle:DriveFile");
        $root = $this->getRootEntity($workspaceId);

        if (!$directoryId || $directoryId == "root") {
            $directoryId = $root->getId();
        }

        if ($directoryId == $root->getId()) {
            if ($trash) {
                $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $this->getTrashEntity($workspaceId)->getId()));
            } else {
                $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $root->getId()));
            }
        } else {
            $list = $repo->findBy(Array("workspace_id" => $workspaceId, "parent_id" => $directoryId));
        }

        return $list;
    }

    public function getPath($workspace_id, $directory_id)
    {

        $repo = $this->em->getRepository("TwakeDriveBundle:DriveFile");

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


}
