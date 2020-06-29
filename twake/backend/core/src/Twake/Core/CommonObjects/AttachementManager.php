<?php
/**
 * Created by PhpStorm.
 * User: tallandierbenoit
 * Date: 01/10/2019
 * Time: 11:25
 */

namespace Twake\Core\CommonObjects;


class AttachementManager
{
    function __construct($doctrine, $ws)
    {
        $this->doctrine = $doctrine;
        $this->ws = $ws;
    }

    public function updateAttachements($object, $attachements = Array())
    {
        $type = $this->getTypeFromClass($object);
        $oldAttachements = $object->getAttachements() ? $object->getAttachements() : Array();
        $newAttachement = $oldAttachements;
        $get_diff = $this->getArrayDiffUsingKeys($attachements, $oldAttachements, ["id"]);
        foreach ($get_diff["del"] as $att) {
            foreach ($newAttachement as $index => $attac) {
                if ($attac["id"] == $att["id"] && $attac["type"] == $att["type"]) {
                    $this->removeAttachementFromEntity($object, $attac);
                    unset($newAttachement[$index]);
                }
            }
        }
        foreach ($get_diff["add"] as $att) {
            $att["isAttached"] = false;
            $newAttachement[] = $att;
            $attachedRepo = $this->getAttachementRepository($att["type"]);
            if ($attachedRepo) {
                $entityAttached = $attachedRepo->findOneBy(Array("id" => $att["id"]));
                if ($entityAttached) {
                    $attachmentInEntityAttached = $entityAttached->getAttachements();
                    $attachmentOfAttached = Array(
                        "type" => $type,
                        "id" => $object->getId(),
                        "name" => $this->getAttachmentName($object),
                        "isAttached" => true
                    );
                    $attachmentInEntityAttached[] = $attachmentOfAttached;
                    $entityAttached->setAttachements($attachmentInEntityAttached);
                    $this->doctrine->persist($entityAttached);
                    $data = Array(
                        "client_id" => "system",
                        "action" => "save",
                        "object_type" => "",
                        "object" => $entityAttached->getAsArray()
                    );
                    error_log("pushing on " . $this->getRoutePush($entityAttached) . ", " . json_encode($data));
                    $this->ws->push($this->getRoutePush($entityAttached), $data);
                }
            }
        }
        $object->setAttachements($newAttachement);
        $this->doctrine->persist($object);
        $this->doctrine->flush();
    }

    private function getTypeFromClass($entity)
    {
        if (get_class($entity) == "Twake\Tasks\Entity\Task") {
            return "task";
        } elseif (get_class($entity) == "Twake\Drive\Entity\DriveFile") {
            return "file";
        } elseif (get_class($entity) == "Twake\Calendar\Entity\Event") {
            return "event";
        }
        return "";
    }

    private function getArrayDiffUsingKeys($new_array, $old_array, $keys)
    {
        $remove = [];
        $add = [];
        foreach ($new_array as $new_el) {
            if (!$this->inArrayUsingKeys($old_array, $new_el, $keys)) {
                $add[] = $new_el;
            }
        }
        foreach ($old_array as $old_el) {
            if (!$this->inArrayUsingKeys($new_array, $old_el, $keys)) {
                $remove[] = $old_el;
            }
        }
        return Array("del" => $remove, "add" => $add);
    }

    private function inArrayUsingKeys($array, $element, $keys)
    {
        $in = false;
        foreach ($array as $el) {
            $same = true;
            foreach ($keys as $key) {
                if ($el[$key] != $element[$key]) {
                    $same = false;
                    break;
                }
            }
            if ($same) {
                $in = true;
                break;
            }
        }
        return $in;
    }

    private function removeAttachementFromEntity($object, $attachement)
    {
        $type = $this->getTypeFromClass($object);
        $attachedRepo = $this->getAttachementRepository($attachement["type"]);
        $entityAttached = $attachedRepo->findOneBy(Array("id" => $attachement["id"]));
        $attachmentInEntityAttached = $entityAttached->getAttachements();
        foreach ($attachmentInEntityAttached as $index => $attac) {
            error_log("try " . $attac["id"] . " == " . $object->getId() . ",   " . $attac["type"] . " == " . $type);
            if ($attac["id"] == $object->getId() && $attac["type"] == $type) {
                error_log("remove  passive" . json_encode($attac));
                unset($attachmentInEntityAttached[$index]);
                $entityAttached->setAttachements($attachmentInEntityAttached);
                $this->doctrine->persist($entityAttached);
                $data = Array(
                    "client_id" => "system",
                    "action" => "save",
                    "object_type" => "",
                    "object" => $entityAttached->getAsArray()
                );
                $this->ws->push($this->getRoutePush($entityAttached), $data);
                break;
            }
        }
    }

    private function getAttachementRepository($type)
    {
        if ($type == "file") {
            return $this->doctrine->getRepository("Twake\Drive:DriveFile");
        } elseif ($type == "task") {
            return $this->doctrine->getRepository("Twake\Tasks:Task");
        } elseif ($type == "event") {
            return $this->doctrine->getRepository("Twake\Calendar:Event");
        }
        return false;
    }

    private function getRoutePush($entity)
    {
        if (get_class($entity) == "Twake\Tasks\Entity\Task") {
            return "board_tasks/" . $entity->getBoardId();
        } elseif (get_class($entity) == "Twake\Drive\Entity\DriveFile") {
            return "drive/" . $entity->getWorkspaceId() . "/" . $entity->getParentId();
        } elseif (get_class($entity) == "Twake\Calendar\Entity\Event") {
            return "calendar_events/" . $entity->getWorkspaceId();
        }
        return "";
    }

    private function getAttachmentName($entity)
    {
        if (get_class($entity) == "Twake\Tasks\Entity\Task") {
            return $entity->getTitle();
        } elseif (get_class($entity) == "Twake\Drive\Entity\DriveFile" || get_class($entity) == "Twake\Calendar\Entity\Event") {
            return $entity->getName();
        }
        return "";
    }

    public function removeAttachementsFromEntity($object)
    {
        $attachementsToRemove = $object->getAttachements();
        foreach ($attachementsToRemove as $attachement) {
            error_log("remove attachement" . json_encode($attachement));
            $this->removeAttachementFromEntity($object, $attachement);
        }
    }

}