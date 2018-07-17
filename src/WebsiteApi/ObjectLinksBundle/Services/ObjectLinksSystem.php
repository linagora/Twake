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

    public function getRepositoryFromKey($key){
        return self::$keyMap[$key];
    }
}