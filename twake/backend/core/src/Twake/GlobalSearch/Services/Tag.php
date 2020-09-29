<?php

namespace Twake\GlobalSearch\Services;

use Twake\GlobalSearch\Entity\WorkspaceTag;
use App\App;

Class Tag
{

    private $em;

    public function __construct(App $app)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
        $this->access_manager = $app->getServices()->get("app.accessmanager");
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        $route = explode("/", $route);
        $workspace_id = $route[1];

        if (!$workspace_id) {
            return false;
        }

        return $this->hasAccess([
            "workspace_id" => $workspace_id
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
        return $this->access_manager->has_access($current_user, [
            "type" => "Workspace",
            "edition" => false,
            "object_id" => $data["workspace_id"]
        ]);
    }

    public function get($options, $current_user)
    {

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }


        $list = Array();
        if (isset($options["workspace_id"])) {
            $workspace_id = $options["workspace_id"];
            if (isset($options["id"])) {
                $tag = $this->em->getRepository("Twake\GlobalSearch:WorkspaceTag")->findOneBy(Array("workspace_id" => $workspace_id, "id" => $options["id"]));
                if (isset($tag)) {
                    $list[] = $tag->getAsArray();
                }

            } else {
                $tags = $this->em->getRepository("Twake\GlobalSearch:WorkspaceTag")->findBy(Array("workspace_id" => $workspace_id));
                foreach ($tags as $tag) {
                    $list[] = $tag->getAsArray();
                }
            }
        }

        return $list;

    }

    public function remove($object, $options, $current_user = null, $return_entity = false)
    {
        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        if (isset($object["id"])) { // on recoit un identifiant donc on supprime un tag
            $tag = $this->em->getRepository("Twake\GlobalSearch:WorkspaceTag")->findOneBy(Array("id" => $object["id"]));

            $this->em->remove($tag);
            $this->em->flush();

        } else {
            return false;
        }

        if ($return_entity) {
            return $tag;
        }
        return $tag->getAsArray();

    }

    public function save($object, $options, $current_user = null, $return_entity = false)
    {
        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }

        $tag = null;
        if (isset($object["id"]) && $object["id"]) { // on recoit un identifiant donc c'est un modification
            $tag = $this->em->getRepository("Twake\GlobalSearch:WorkspaceTag")->findOneBy(Array("id" => $object["id"]));
            if (!$tag) {
                return false;
            }
        } else { // pas d'identifiant on veut donc créer un tag
            $name = $object["name"];
            $workspace_id = $object["workspace_id"];
            if ($this->checkname($workspace_id, $name)) {
                $tag = new WorkspaceTag($workspace_id, $name);
                if ($object["front_id"]) {
                    $tag->setFrontId($object["front_id"]);
                }
            }else{
                return false;
            }
            $did_create = true;
        }

        if (isset($object["color"])) {
            $tag->setColor($object["color"]);
        }

        if (!$did_create && isset($object["name"])) {
            if ($this->checkname($tag->getWorkspaceId(), $object["name"])) {
                $tag->setName($object["name"]);
            }
        }


        if (isset($tag)) {
            $this->em->persist($tag);
            $this->em->flush();
        }

        if ($return_entity) {
            return $tag;
        }
        if (isset($tag)) {
            return $tag->getAsArray();
        }

    }

    public function checkname($workspace_id, $name)
    {
        $tags = $this->em->getRepository("Twake\GlobalSearch:WorkspaceTag")->findBy(Array("workspace_id" => $workspace_id));
        $valid = true;
        foreach ($tags as $tag) {
            if ($tag->getName() == $name) {
                $valid = false;
            }
        }

        return $valid;
    }

//    public function addTags($object,$tags){
//        $actual_tags = $object->gettags();
//
//        $object->setTags($tags);
//        $this->em->persist($object);
//        $this->em->flush();
//
//        $diff = array_merge(array_diff($tags, $actual_tags), array_diff($actual_tags, $tags));
//
//        foreach ($diff as $d){
//            //mettre a jour les compteurs
//        }
//
//    }
}