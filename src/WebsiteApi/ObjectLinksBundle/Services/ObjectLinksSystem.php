<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 16/07/18
 * Time: 09:50
 */

namespace WebsiteApi\ObjectLinksBundle\Services;


use WebsiteApi\ObjectLinksBundle\Entity\ObjectLinks;
use WebsiteApi\ObjectLinksBundle\Model\ObjectLinksInterface;

class ObjectLinksSystem
{
    var $doctrine;
    var $pusher;

    static $keyMap = Array();

    public function __construct($doctrine, $pusher)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;

        if (count(self::$keyMap) == 0) {
            self::$keyMap["file"] = "TwakeDriveBundle:DriveFile";
            self::$keyMap["event"] = "TwakeCalendarBundle:CalendarEvent";
            self::$keyMap["task"] = "TwakeProjectBundle:BoardTask";
            self::$keyMap["call"] = "TwakeDiscussionBundle:Call";
        }
    }

    public function getObjectLinks($id, $type)
    {
        $resA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("ida" => $id, "typea" => self::$keyMap[$type]));
        $resB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idb" => $id, "typeb" => self::$keyMap[$type]));

        $object = $this->doctrine->getRepository(self::$keyMap[$type])->findOneBy(Array("id" => $id));

        $returnVal = Array();
        if($resA || $resB) {

            $res = array_merge($resA, $resB);

            foreach ($res as $entry) {
                /* @var ObjectLinks $entry */
                /* @var ObjectLinksInterface $obj */
                $repo = ($entry->getIdA() != $id) ? $entry->getTypeA() : $entry->getTypeB();
                $entryId = ($entry->getIdA() != $id) ? $entry->getIdA() : $entry->getIdB();
                $obj = $this->doctrine->getRepository($repo)->findOneBy(Array("id" => $entryId));
                if ($obj) {
                    array_push($returnVal, $obj);
                } else {
                    $this->deleteObjectLink($entry->getTypeA(), $entry->getTypeB(), $entry->getIdA(), $entry->getIdB());
                }

            }

            if ($object) {
                $formated = [];
                foreach ($returnVal as $ret) {
                    $formated[] = $ret->getAsArrayFormated();
                }
                $object->setObjectLinkCache($formated);
                $this->doctrine->persist($object);
                $this->doctrine->flush();
            }

            return $returnVal;
        }else{
            return [];
        }
    }

    /* @return ObjectLinksInterface*/
    public function getObjectFromRepositoryAndId($repository, $id){
        return $this->doctrine->getRepository($repository)->findOneBy(Array("id" => $id));
    }

    public function createObjectLink(ObjectLinksInterface $objectA,ObjectLinksInterface $objectB){
        $link = new ObjectLinks($objectA->getRepository(), $objectA->getId(), $objectB->getRepository(), $objectB->getId());
        $this->doctrine->persist($link);
        $this->doctrine->flush();
    }

    public function createObjectLinkFromType($typeA, $typeB, $idA, $idB){
        $link = new ObjectLinks(self::$keyMap[$typeA], $idA, self::$keyMap[$typeB], $idB);
        $exists = $this->doctrine->getRepository('TwakeObjectLinksBundle:ObjectLinks')->findBy(array(
            'ida' => $idA,
            'idb' => $idB,
            'typea' => $link->getTypeA(),
            'typeb' => $link->getTypeB()
        ));

        if (!$exists) {

            $exists = $this->doctrine->getRepository('TwakeObjectLinksBundle:ObjectLinks')->findBy(array(
                'idb' => $idA,
                'ida' => $idB,
                'typeb' => $link->getTypeA(),
                'typea' => $link->getTypeB()
            ));

            if (!$exists) {

                $objA = $this->getObjectFromRepositoryAndId($link->getTypeA(), $idA);
                $objB = $this->getObjectFromRepositoryAndId($link->getTypeB(), $idB);
                if ($objA && $objB) {
                    $this->doctrine->persist($link);
                    $this->doctrine->flush();

                    $this->updateObject($objA);

                    $link = "success";
                } else {
                    $link = "idNotFound";
                }

            } else {
                $link = "alreadyThere";
            }
        } else {
            $link = "alreadyThere";
        }
        return $link;
    }

    public function findOneTwoWays($typeA,$typeB,$idA,$idB){
        $repo =  $this->doctrine->getRepository('TwakeObjectLinksBundle:ObjectLinks');

        $exists =$repo->findOneBy(array(
            'ida' => $idA,
            'idb' => $idB,
            'typea' => self::$keyMap[$typeA],
            'typeb' => self::$keyMap[$typeB]
        ));

        if(!$exists){ //test inversion param
            $exists =$repo->findOneBy(array(
                'ida' => $idB,
                'idb' => $idA,
                'typea' => self::$keyMap[$typeB],
                'typeb' => self::$keyMap[$typeA]
            ));
        }

        return $exists;

    }

    public function deleteObjectLink($typeA,$typeB,$idA,$idB){
        $exists = $this->findOneTwoWays($typeA,$typeB,$idA,$idB);
        if ($exists) {
            if($this->getObjectFromRepositoryAndId(self::$keyMap[$typeA], $idA) && $this->getObjectFromRepositoryAndId(self::$keyMap[$typeB], $idB)) {

                $this->doctrine->remove($exists);
                $this->doctrine->flush();
                $link = "success";
            }else{
                $link = "idNotFound";
            }
        } else {
            $link = "notThere";
        }

        return $link;
    }

    public function deleteLinkedObjects($id, $type, $linkedIdsToDelete, $linkedIdsType){
        $relationsA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("ida" => $id, "typea" => $type));
        $relationsB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idb" => $id, "typeb" => $type));
        $relations = array_merge($relationsA,$relationsB);
        $needFlush = false;
        $deleted = 0;

        foreach ($relations as $relation){
            /* @var ObjectLinks $relation*/
            $toDelete = false;
            if(in_array($relation->getIdA(),$linkedIdsToDelete)){
                if($linkedIdsType[$relation->getIdA()]==$relation->getTypeA()){
                    $toDelete = [$relation->getIdA(), $relation->getTypeA()];
                }
            }
            if(in_array($relation->getIdB(),$linkedIdsToDelete)){
                if($linkedIdsType[$relation->getIdB()]==$relation->getTypeB()){
                    $toDelete = [$relation->getIdB(), $relation->getTypeB()];
                }
            }
            if($toDelete) {
                $this->doctrine->remove($this->getObjectFromRepositoryAndId($toDelete[1],$toDelete[0]));
                $needFlush=true;
                $deleted++;
            }
        }
        if($needFlush)
            $this->doctrine->flush();

        return $deleted;
    }

    public function getRepositoryFromKey($key){
        return self::$keyMap[$key];
    }

    public function getPartners(ObjectLinksInterface $object){
        $relationsA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("ida" => $object->getId(), "typea" => $object->getRepository()));
        $relationsB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idb" => $object->getId(), "typeb" => $object->getRepository()));
        $relations = array_merge($relationsA,$relationsB);

        $partners = [];
        foreach ($relations as $relation){
            /* @var ObjectLinks $relation*/
            if($relation->getTypeA()==$object->getRepository() && $relation->getIdA()==$object->getId())
                $object = $this->getObjectFromRepositoryAndId($relation->getTypeB(), $relation->getIdB());
            else
                $object = $this->getObjectFromRepositoryAndId($relation->getTypeA(), $relation->getIdA());

            $partners[] = $object;
        }

        return $partners;
    }

    public function getPartnersAndFieldsToSynchronised(ObjectLinksInterface $object){
        $relationsA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("ida" => $object->getId(), "typea" => $object->getRepository()));
        $relationsB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idb" => $object->getId(), "typeb" => $object->getRepository()));

        $partners = Array();
        $i= 0;
        $relations = array_merge($relationsA,$relationsB);

        foreach ($relations as $relation){
            /* @var ObjectLinks $relation*/
            if(count($relation->getFieldsToSynchronised())==0)
                continue;
            if ($relation->getTypeA() == $object->getRepository() && $relation->getIdA() == $object->getId()) {
                $object_ = $this->getObjectFromRepositoryAndId($relation->getTypeB(), $relation->getIdB());
                $type_ = $relation->getTypeB();
            } else {
                $object_ = $this->getObjectFromRepositoryAndId($relation->getTypeA(), $relation->getIdA());
                $type_ = $relation->getTypeA();
            }

            $partners[] = Array("object" => Array(), "fields" => Array() );
            $partners[$i]["type"] = $type_;
            $partners[$i]["object"] = $object_;
            $partners[$i]["fields"] = $relation->getFieldsToSynchronised();
            $i++;
        }

        return $partners;
    }

    public function updateObject(ObjectLinksInterface $object)
    {
        $partnersAndFields = $this->getPartnersAndFieldsToSynchronised($object);

        foreach ($partnersAndFields as $partnerAndFields) {
            $partner = $partnerAndFields["object"];
            $fields = $partnerAndFields["fields"];

            if ($partner) {
                $didSync = false;

                $data = Array();
                /* @var ObjectLinksInterface $partner */
                foreach ($fields as $field) {
                    $value = $object->get($field);
                    $data[$field] = $value;
                    if ($value || is_array($value)) {
                        $didSync = true;
                        $partner->synchroniseField($field, $value);
                    }
                }
                $partner->finishSynchroniseField($data);

                if ($didSync) {
                    $route = $partner->getPushRoute();
                    if ($route) {
                        $this->pusher->push(Array(
                            "type" => "link_update",
                            "data" => $partner->getAsArray()
                        ), $route);
                    }
                }
                $this->doctrine->persist($partner);
            }
        }
        $this->doctrine->flush();

        return $partnersAndFields;
    }

    public function deleteObject(ObjectLinksInterface $object)
    {
        $relations = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("ida" => $object->getId(), "typea" => $object->getRepository()));
        $relations = array_merge($relations, $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idb" => $object->getId(), "typeb" => $object->getRepository())));
        foreach ($relations as $relation) {
            $this->doctrine->remove($relation);
        }
        $this->doctrine->flush($relation);
    }

}
