<?php


namespace WebsiteApi\DriveBundle\Services;


use WebsiteApi\DriveBundle\Entity\DriveFile;

class DriveSystem
{

    function __construct($entity_manager, $drive_file_system_selector)
    {
        $this->em = $entity_manager;
        $this->dfs = $drive_file_system_selector->getFileSystem();
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

        if (!$directory_id) {
            $directory_id = "root";
        }

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $elements = $this->dfs->listDirectory($workspace_id, $directory_id);
        $path = $this->dfs->getPath($directory_id);

        $list = Array();
        foreach ($elements as $element) {
            $array = $element->getAsArray();
            $array["path"] = $path;
            $list[] = $array;
        }

        return $list;

    }

    public function remove($object, $options, $current_user)
    {

    }

    public function save($object, $options, $user = null, $application = null)
    {

        if (!$object["workspace_id"]) {
            $object["workspace_id"] = "";
        }

        if (!$object["parent_id"]) {
            $object["parent_id"] = "";
        } else {
            //TODO check parent correspond to a folder of workspace_id
        }

        $drive_files_repo = $this->em->getRepository("TwakeDriveBundle:DriveFile");


        $drive_element = null;

        if (isset($object["id"])) {
            $drive_element = $drive_files_repo->findOneBy(Array("workspace_id" => $object["workspace_id"], "parent_id" => $object["parent_id"], "id" => $object["id"]));

            //Verify can modify this message
            if ($drive_element && !$this->hasAccess($object, $current_user, $drive_element)) {
                return false;
            }
        }

        if ($drive_element == null) {

            //Verify can create in workspace
            if (!$this->hasAccess($object, $current_user)) {
                return false;
            }

            //Create a new drive element
            $drive_element = new DriveFile($object["workspace_id"], $object["parent_id"], $object["is_directory"]);
            $drive_element->setFrontId($object["front_id"]);

            //TODO update workspace number of files

        }

        $drive_element->setName($object["name"]);

        $this->em->persist($drive_element);
        $this->em->flush();

        return $drive_element->getAsArray();

    }

}
