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
        $directory_id = $options["directory_id"];
        $workspace_id = $options["workspace_id"];
        $trash = $options["trash"];

        if (!$directory_id) {
            $directory_id = "root";
        }

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }
        $elements = $this->dfs->listDirectory($workspace_id, $directory_id, $trash);

        $path = $this->dfs->getPath($workspace_id, $directory_id);

        $list = Array();
        foreach ($elements as $element) {
            $array = $element->getAsArray();
            $array["path"] = $path;
            $list[] = $array;
        }
        var_dump($list);
        return $list;

    }

    public function remove($object, $options, $current_user)
    {

    }

    public function save($object, $options, $current_user = null)
    {

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $intrash = $object["intrash"];

        $parent_id = $object["parent_id"];
        if(isset($parent_id)){
            $parent_id="";
        }

        $fileordirectory = $this->em->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
        foreach ($fileordirectory as $file){
            var_dump($file->getAsArray());
        }

        if(isset($object["id"])){ // on recoit un identifiant donc c'est un modification
            $fileordirectory = $this->em->getRepository("TwakeDriveBundle:DriveFile")
                ->findOneBy(Array("id" => $object["id"]));
            var_dump("id found");
            $fileordirectory_parent_id = $fileordirectory->getParentId();
            if($fileordirectory_parent_id != $parent_id){ //changement de parent id donc le fichier a été déplacé.
                var_dump("diffrent parent id ");
                $fileordirectory->setOldParent($fileordirectory_parent_id);
                $fileordirectory->setParent($parent_id);
                $size = $fileordirectory->getSize();
                //on doit modifer la taille recursivement de l'ancien dossier parent
                $this->updateSize($fileordirectory_parent_id,-$size);
                if(!isset($object["detached"])){
                    var_dump("change size not detached ");

                    //et de la même façon la taille du dossier d'accueil et de ses parents.
                    //$this->updateSize($parent_id,$size);
                }
                else{
                    var_dump("add workspace and change detached ");
                    $fileordirectory->setDetachedFile(false);
                    $fileordirectory->setWorkspaceId($object["workspace_id_id"]);
                }

            }
        }
        else{ // pas d'identifiant on veut donc créer un fichier
            $front_id = $object["front_id"];
            $workspace_id = $object["workspace_id"];
            if(isset($object["workspace_id"])){
                $fileordirectory = new DriveFile($workspace_id,$parent_id);
                $fileordirectory->setParentId($parent_id);
            }
            if(isset($object["detached"])){
                $fileordirectory = new DriveFile("",$parent_id);
                $fileordirectory->setParentId("");
                $fileordirectory->setDetachedFile(true);
            }
        }

        if(isset($object["name"])){
            $fileordirectory->setName($object["name"]);
        }
        //rajouter l 'utilsateur courant dans le fichier.
        //$fileordirectory->setUser($current_user);

        // on sauvegarde l'objets et/ou les modifications en base
        $this->em->persist($fileordirectory);
        //$this->em->flush();
        //on renvoie l'objet nouvellement crée
        //var_dump($fileordirectory->getAsArray());
        return $fileordirectory;



    }

    protected function updateSize($directory, $delta) // on passe l'id du directory
    {
        while ($directory != null) {

            if ($directory == "root") {
                $directory = $this->getRootEntity();
            }

            if(is_string($directory)){
                //error_log("search scylla");
                $directory = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory));

            }
            if (!$directory ){//|| is_string($directory)) {
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
                $this->doctrine->persist($directory);
                $this->doctrine->flush();
                $directory = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $directory->getId()));
                //error_log(print_r("get size: ".$directory->getSize(),true));
                $directory = $directory->getParentId();
                //error_log(print_r("parent id: ".$directory,true));
//                error_log("\n");
//                error_log("\n");
            }
        }
    }

}
