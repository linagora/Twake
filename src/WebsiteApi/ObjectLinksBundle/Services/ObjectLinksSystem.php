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

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function getObjectFromRepositoryAndId($repository, $id){
        return $this->doctrine->getRepository($repository)->findOneBy(Array("id" => $id));
    }

    public function createObjectLink(ObjectLinksInterface $objectA,ObjectLinksInterface $objectB){
        $link = new ObjectLinks($objectA->getRepository(), $objectA->getId(), $objectB->getRepository(), $objectB->getId());
        $this->doctrine->persit($link);
        $this->doctrine->flush();
    }
}