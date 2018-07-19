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

    static $keyMap = Array();

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
        if(count($this->keyMap)==0){
            self::$keyMap["file"] = "TwakeDriveBundle:DriveFile";
            self::$keyMap["event"] = "TwakeCalendarBundle:CalendarEvent";
            self::$keyMap["task"] = "TwakeProjectBundle:BoardTask";
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
            return null;
        }
    }

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

    public function getRepositoryFromKey($key){
        return self::$keyMap[$key];
    }
}