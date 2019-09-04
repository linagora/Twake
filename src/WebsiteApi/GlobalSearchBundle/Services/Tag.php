<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\GlobalSearchBundle\Entity\WorkspaceTag;

Class Tag{

    private $em;

    function __construct($entity_manager)
    {
        $this->em = $entity_manager;

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

        $list= Array();
        if(isset($options["workspace_id"])){
            $workspace_id = $options["workspace_id"];
            if(isset($options["id"])){
                $tag = $this->em->getRepository("TwakeGlobalSearchBundle:WorkspaceTag")->findOneBy(Array("workspace_id" => $workspace_id, "id" => $options["id"]));
                if(isset($tag)){
                    $list[] = $tag->getAsArray();
                }

            }
            else{
                $tags = $this->em->getRepository("TwakeGlobalSearchBundle:WorkspaceTag")->findBy(Array("workspace_id" => $workspace_id));
                foreach ($tags as $tag) {
                    $list[] = $tag->getAsArray();
                }
            }
        }

        return $list;

    }

    public function remove($object, $options, $current_user = null, $return_entity = false)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if(isset($object["id"])) { // on recoit un identifiant donc on supprime un tag
            $tag= $this->em->getRepository("TwakeGlobalSearchBundle:WorkspaceTag")->findOneBy(Array("id" => $object["id"]));

            $this->em->remove($tag);
            $this->em->flush();

            //$this->notifyConnectors($fileordirectory, "remove", $current_user);

        }
        else{
            return false;
        }

        if ($return_entity) {
            return $tag;
        }
        return $tag->getAsArray();

    }

    public function save($object, $options, $current_user = null, $return_entity = false)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $tag = null;
        if (isset($object["id"]) && $object["id"]) { // on recoit un identifiant donc c'est un modification
            $tag= $this->em->getRepository("TwakeGlobalSearchBundle:WorkspaceTag")->findOneBy(Array("id" => $object["id"]));
            if(!$tag){
                return false;
            }
        }
        else { // pas d'identifiant on veut donc créer un tag
            $name= $object["name"];
            $workspace_id = $object["workspace_id"];
            $tag = new WorkspaceTag($workspace_id, $name);
            $did_create = true;
        }

        if (isset($object["color"])) {
            $tag->setColor($object["color"]);
        }

        if (!$did_create && isset($object["name"])) {
            $tag->setName($object["name"]);
        }

        if (!$did_create && isset($object["workspace_id"])) {
            $tag->setWorkspaceId($object["workspace_id"]);
        }

        if(isset($tag)){
            $this->em->persist($tag);
            $this->em->flush();
        }

        //$this->notifyConnectors($fileordirectory, $did_create, $current_user);

        if ($return_entity) {
            return $tag;
        }
        return $tag->getAsArray();

    }
}