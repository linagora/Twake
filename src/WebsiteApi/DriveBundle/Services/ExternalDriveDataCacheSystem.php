<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 12/06/18
 * Time: 11:14
 */

namespace WebsiteApi\DriveBundle\Services;


use WebsiteApi\DriveBundle\Entity\ExternalDriveDataCache;

class ExternalDriveDataCacheSystem
{
    var $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function update($id, $drive, $data){
        $cache = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDriveDataCache")->findOneBy(Array(
            "id" => $id,
            "drive" => $drive));

        if(!$cache)
            $cache = new ExternalDriveDataCache($id,$drive);

        $cachedData = $cache->getData();

        foreach ($data as $key => $value) {
            $cachedData[$key] = $value;
        }

        $cache->setData($cachedData);

        $this->doctrine->persist($cache);
        $this->doctrine->flush();
    }

}