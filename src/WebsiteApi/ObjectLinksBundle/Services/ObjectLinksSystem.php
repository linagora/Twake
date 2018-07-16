<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 16/07/18
 * Time: 09:50
 */

namespace WebsiteApi\ObjectLinksBundle\Services;


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
}