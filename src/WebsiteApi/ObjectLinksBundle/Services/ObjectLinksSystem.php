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

    public function getObjectLinksById($id){
        $resA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idA" => $id));
        $resB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idB" => $id));

        $returnVal = Array();
        if($resA || $resB) {

            $res = array_merge($resA, $resB);

            foreach ($res as $entry) {
                /* @var ObjectLinks $entry */
                /* @var ObjectLinksInterface $obj */
                $repo = ($entry->getIdA() != $id) ? $entry->getTypeA() : $entry->getTypeB();
                $entryId = ($entry->getIdA() != $id) ? $entry->getIdA() : $entry->getIdB();
                $obj = $this->doctrine->getRepository($repo)->findOneBy(Array("id" => $entryId));
                array_push($returnVal, $obj);

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
            'idA' => $idA,
            'idB' => $idB,
            'typeA' => $link->getTypeA(),
            'typeB' => $link->getTypeB()
        ));

        if (!$exists) {
            if($this->getObjectFromRepositoryAndId($link->getTypeA(), $idA) && $this->getObjectFromRepositoryAndId($link->getTypeB(), $idB)) {
                $this->doctrine->persist($link);
                $this->doctrine->flush();
                $link = "success";
            }else{
                $link = "idNotFound";
            }
        } else {
            $link = "alreadyThere";
        }
        return $link;
    }

    public function findOneTwoWays($typeA,$typeB,$idA,$idB){
        $repo =  $this->doctrine->getRepository('TwakeObjectLinksBundle:ObjectLinks');

        $exists =$repo->findOneBy(array(
            'idA' => $idA,
            'idB' => $idB,
            'typeA' => self::$keyMap[$typeA],
            'typeB' => self::$keyMap[$typeB]
        ));

        if(!$exists){ //test inversion param
            $exists =$repo->findOneBy(array(
                'idA' => $idB,
                'idB' => $idA,
                'typeA' => self::$keyMap[$typeB],
                'typeB' => self::$keyMap[$typeA]
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
        $relationsA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idA" => $id, "typeA" => $type));
        $relationsB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idB" => $id, "typeB" => $type));
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
        $relationsA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idA" => $object->getId(), "typeA" => $object->getRepository()));
        $relationsB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idB" => $object->getId(), "typeB" => $object->getRepository()));
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
        $relationsA = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idA" => $object->getId(), "typeA" => $object->getRepository()));
        $relationsB = $this->doctrine->getRepository("TwakeObjectLinksBundle:ObjectLinks")->findBy(Array("idB" => $object->getId(), "typeB" => $object->getRepository()));

        $partners = Array();
        $i= 0;
        $relations = array_merge($relationsA,$relationsB);

        foreach ($relations as $relation){
            /* @var ObjectLinks $relation*/
            if(count($relation->getFieldsToSynchronised())==0)
                continue;
            if($relation->getTypeA()==$object->getRepository() && $relation->getIdA()==$object->getId())
                $object = $this->getObjectFromRepositoryAndId($relation->getTypeB(), $relation->getIdB());
            else
                $object = $this->getObjectFromRepositoryAndId($relation->getTypeA(), $relation->getIdA());

            $partners[] = Array("object" => Array(), "fields" => Array() );
            $partners[$i]["object"] = $object;
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

            /* @var ObjectLinksInterface $partner */
            foreach ($fields as $field) {
                $value = $object->get($field);
                $partner->synchroniseField($field, $value);
                $this->pusher->push($partner->getAsArray(), $partner->getPushRoute());
                $this->doctrine->persist($partner);
            }
        }
        $this->doctrine->flush();
    }
}
