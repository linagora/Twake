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

        if(isset($options["id"])) {
            $fileordirectory = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $options["id"].""));
            return $fileordirectory;
        }
        elseif(isset($options["workspace_id"])){
            return $this->getRootEntity($options["workspace_id"]);
        }
    }

    public function recursedelete($directory){
        //error_log(print_r($directory->getId(),true));
        $fileson = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $directory->getWorkspaceId()."", "parent_id" => $directory->getId().""));
        if(isset($fileson)){
            foreach ($fileson as $file){
                $this->recursedelete($file);
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
                $this->updateSize($fileordirectory->getParentId(), -$fileordirectory->getSize(), 0);
                //error_log(print_r($object["id"],true));
                //on a besoin de voir si le fichier qu'on veut supprimer était lui même parent d'autre fichier
                $fileson = $this->em->getRepository("TwakeDriveBundle:DriveFile")
                    ->findBy(Array("workspace_id" => $fileordirectory->getWorkspaceId()."", "parent_id" => $object["id"].""));
                if(isset($fileson)){
                    foreach ($fileson as $file){
                        $this->recursedelete($file);
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
        $last_version = $this->em->getRepository("TwakeDriveBundle:DriveFileVersion")->findOneBy(Array("id" => $fileordirectory->getLastVersionId()));

        if (!$last_version || $create_new_version) { // on crée une nouvelle version pour le fichier en question
            $last_version = new DriveFileVersion($fileordirectory, $current_user);
        }

        $last_version->setData(isset($upload_data["data"]) ? $upload_data["data"] : Array());
        $last_version->setSize(isset($upload_data["size"]) ? $upload_data["size"] : 0);

        $fileordirectory->setSize($last_version->getSize());

        $this->em->persist($version);
        $this->em->flush();

    }

    public function save($object, $options, $current_user = null, $upload_data = Array(), $return_entity = false)
    {

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $did_create = false;
        $fileordirectory = null;
        if(isset($object["id"])) { // on recoit un identifiant donc c'est un modification
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
            //$fileordirectory->setIsInTrash(false);
            if (isset($object["detached"]) && $object["detached"]) {
                $fileordirectory->setDetachedFile(true);
                $parent_id = "detached";
            }

            $did_create = true;
        }

        if (isset($object["trash"]) && $object["trash"] && !$did_create){ // on veut mettre un fichier a la corbeille
            $oldparent = $fileordirectory->getParentId()."";
            $newparent = $this->getTrashEntity($fileordirectory->getWorkspaceId()."")->getId()."";
            //error_log(print_r("new parent id: " . $newparent,true));
            $this->move($fileordirectory,$oldparent,$newparent,1);

            $fileordirectory->setOldParent($oldparent);


            $this->recursetrash($fileordirectory);


        }
        elseif(isset($object["trash"]) && !$object["trash"] && !$did_create){ //on veut restaurer un fichier de la corbeille sur son ancien parent
            $oldparent = $fileordirectory->getParentId()."";
            $newparent = $fileordirectory->getOldParent()."";
            $parenttrash = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id"=> $oldparent));
            if($parenttrash->getIsInTrash() && $newparent === ""){ // Si le parent est a la corbeille également on va le mettre a la racine du workspace
                $newparent = $this->getRootEntity($fileordirectory->getWorkspaceId()."")->getId()."";
            }
            $this->move($fileordirectory,$oldparent,$newparent,2);

            $fileordirectory->setOldParent("");
            $this->recursetrash($fileordirectory);

        }


        if(isset($object["parent_id"]) && $object["parent_id"] != ""){
            $parent_id = $object["parent_id"]."";

            if($did_create) { // on set le fichier avec le bon parent
                $file_parent = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id"=> $object["parent_id"].""));
                if($file_parent == null){
                    return false;
                }
            }
            else{ // on a un parent ce n'est pas une creation c'est un déplacement
                $fileordirectory_parent_id = $fileordirectory->getParentId()."";
                if ($fileordirectory_parent_id != $parent_id) { //changement de parent id donc le fichier a été déplacé.
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


        if(isset($object["name"])){
            $fileordirectory->setName($object["name"]);
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
            $new = true;
        }

        //Update size if file was created AFTER versionning
        if (!$fileordirectory->getIsDirectory()) {
            $size_before = $fileordirectory->getSize();
            $this->versionning($fileordirectory, $current_user, $upload_data, $new);
            $size_after = $fileordirectory->getSize();
            if ($size_after - $size_before != 0) {
                $this->updateSize($fileordirectory->getId(), $size_after - $size_before, false);
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
//        $file = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory->getId()));
//        if(isset($file)){
//            $this->em->remove($file);
//            $this->em->flush();
//        }
        $directory->setIsInTrash(!($directory->getIsInTrash()));
        $this->em->persist($directory);
        $this->em->flush();
    }

    public function move($fileordirectory,$oldparent, $newparent, $to_or_out_trash = 0){
        $this->em->remove($fileordirectory);
        $this->em->flush();
        $fileordirectory->setParentId($newparent);
        $size = $fileordirectory->getSize();
        if ($fileordirectory->getDetachedFile() == false) {
            //on doit modifer la taille recursivement de l'ancien dossier parent
            $this->updateSize($oldparent, -$size, $to_or_out_trash);
        } else {
            $fileordirectory->setDetachedFile(false);
        }
        $this->updateSize($newparent, $size, $to_or_out_trash);

    }

    protected function updateSize($directory, $delta, $to_or_out_trash) // on passe l'id du directory
    {
        while ($directory != null) {
            if ($directory == "root") {
                $directory = $this->getRootEntity();
            }
            if(is_string($directory)){
                $directory = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory.""));

            }
            if (!$directory ){
                $directory = null;

            }
            if($directory != null){

                if(!($directory->getParentId() == "" && (($to_or_out_trash === 1 && $delta > 0) || ($to_or_out_trash === 2 && $delta < 0)))){
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
        $root = $this->getRootEntity($workspace_id);
        $root_id = $root->getId()."";

        $trash = $this->em->getRepository("TwakeDriveBundle:DriveFile")
            ->findBy(Array("workspace_id" => $workspace_id."", "parent_id" => $root_id, "isintrash" => false));
        foreach ($trash as $file){
            if($file->getName() === "trash"){
                $trash = $file;
                break;
            }
        }
        if (!$trash) {
            $trash = new DriveFile($workspace_id, $root_id, true);
            $trash->setName("trash");
            $this->em->persist($trash);
            $this->em->flush();
        }
        return $trash;
    }
    public function give_file_public_access($file_id, $is_editable = false, $authorized_members = Array(), $authorized_channels = Array())
    {
        $df = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $file_id));
        //on cree la liste des personnes autorizé;
        $token = sha1(bin2hex(random_bytes(20)));;
        $jsondata = Array(
            "token" => $token,
            "authorized_members" => $authorized_members,
            "authorized_channels" => $authorized_channels,
            "is_editable" => $is_editable);
        $df->setPublicAccesInfo($jsondata);
        $this->em->persist($df);
        $this->em->flush();
    }

    public function give_file_private_access($file_id)
    {
        $df = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $file_id));
        $jsondata = Array(
            "token" => "",
            "authorized_members" => Array(),
            "authorized_channels" => Array(),
            "is_editable" => false
        );
        $df->setPublicAccesInfo($jsondata);
        $this->em->persist($df);
        $this->em->flush();
    }


}
