<?php


namespace WebsiteApi\DriveBundle\Services;


use WebsiteApi\DriveBundle\Entity\DriveFile;

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

    public function remove($object, $options, $current_user)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if(isset($object["id"])) { // on recoit un identifiant donc on supprime un drive file
            $fileordirectory = $this->em->getRepository("TwakeDriveBundle:DriveFile")
                ->findOneBy(Array("id" => $object["id"]));
            if($fileordirectory){
                //on change la taille de tous les dossiers parent a celui ci
                $this->updateSize($fileordirectory->getParentId(), -$fileordirectory->getSize());
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
        return $fileordirectory;
    }

    public function save($object, $options, $current_user = null)
    {

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $did_create = false;
        $fileordirectory = null;
        if(isset($object["id"])) { // on recoit un identifiant donc c'est un modification
            $fileordirectory = $this->em->getRepository("TwakeDriveBundle:DriveFile")
                ->findOneBy(Array("id" => $object["id"].""));
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
            $fileordirectory = new DriveFile($workspace_id,"create");
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
            $this->move($fileordirectory,$oldparent,$newparent,true);

            //ON NE DOIT PAS COMPTER LE POIDS DE LA CORBEILLE DANS LA RACIN DONC ON AJUSTE
            $root = $this->getRootEntity($fileordirectory->getWorkspaceId()."");
            $root_size = $root->getSize();
            $this->getRootEntity($fileordirectory->getWorkspaceId()."")->setSize($root_size - $fileordirectory->getSize());
            $this->em->persist($root);
            $this->em->flush();

            //on met recursivement a jour les is in trash de tous les fils de l'objets mis en corbeille
            $fileordirectory->setOldParent($oldparent);
            error_log(print_r($fileordirectory->getAsArray(),true));
            $this->recursetrash($fileordirectory);


        }
        elseif(isset($object["trash"]) && !$object["trash"] && !$did_create){ //on veut restaurer un fichier de la corbeille sur son ancien parent
            $oldparent = "";
            $newparent = $fileordirectory->getOldParent()."";
            $parenttrash = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id"=> $newparent));
            if($parenttrash->getIsInTrash()){ // Si le parent est a la corbeille également on va le mettre a la racine du workspace
                $newparent = $this->getRootEntity()->getId()."";            }
            $this->move($fileordirectory,$oldparent,$newparent);

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
                    $this->move($fileordirectory,$fileordirectory_parent_id,$parent_id);
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

        if(isset($fileordirectory)){
            $this->em->persist($fileordirectory);
            $this->em->flush();
        }

        return $fileordirectory;
    }

    public function recursetrash($directory){ // permet de changer tous les in trash d'une arborescence
        //error_log(print_r($directory->getId(),true));
        $fileson = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $directory->getWorkspaceId()."", "parent_id" => $directory->getId().""));
        if(isset($fileson)){
            foreach ($fileson as $file){
                $this->recursetrash($file);
            }
        }
        $this->em->remove($directory);
        $this->em->flush();
        $directory->setIsInTrash(!($directory->getIsInTrash()));
        $this->em->persist($directory);
        $this->em->flush();
    }

    public function move($fileordirectory,$oldparent, $newparent, $intrash = false){
        $this->em->remove($fileordirectory);
        $this->em->flush();
        $fileordirectory->setParentId($newparent);
        $size = $fileordirectory->getSize();
        if ($fileordirectory->getDetachedFile() == false) {
            //on doit modifer la taille recursivement de l'ancien dossier parent
            $this->updateSize($oldparent, -$size);
        } else {
            $fileordirectory->setDetachedFile(false);
        }
        $this->updateSize($newparent, $size);
    }

    protected function updateSize($directory, $delta) // on passe l'id du directory
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
                //error_log(print_r("directory type: " . gettype($directory),true));
                //error_log(print_r("id ".$directory->getId(),true));
                //error_log(print_r($directory->getAsArray(),true));
                //error_log(print_r("delta: ".$delta,true));
                $currentSize = $directory->getSize();
                //error_log(print_r("currentsize: ".$currentSize,true));
                $actualsize = $directory->getSize();
                $directory->setSize($currentSize + $delta);
                //$directory->setSize(0);
                $currentSize = $directory->getSize();
                //error_log(print_r("aftersize: ".$currentSize,true));
                $this->em->persist($directory);
                $this->em->flush();
                $directory = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory->getId().""));
                //error_log(print_r("get size: ".$directory->getSize(),true));
                $directory = $directory->getParentId();
                //error_log(print_r("parent id: ".$directory,true));
//                error_log("\n");
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
            ->findOneBy(Array("workspace_id" => $workspace_id."", "isintrash" => false, "parent_id" => $root_id));
        if (!$trash) {
            $trash = new DriveFile($workspace_id, $root_id, true);
            $trash->setName("trash");
            $this->em->persist($trash);
            $this->em->flush();
        }
        return $root;
    }

}
