<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 12/06/18
 * Time: 10:54
 */

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * ExternalDriveDataCache
 *
 * @ORM\Table(name="external_drive_data_cache",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\ExternalDriveDataCacheRepository")
 */
class ExternalDriveDataCache
{
    /**
     * @ORM\Column(name="id", type="string", length=255)
     * @ORM\Id
     */
    private $id;


    /**
     * @ORM\Column(type="string", length=255)
     */
    private $drive;

    /**
     * @ORM\Column(type="text")
     */
    private $json;

    /**
     * @ORM\Column(type="cassandra_datetime")
     */
    private $lastUpdate;

    public function __construct($id,$drive){
        $this->id = $id;
        $this->drive = $drive;
        $this->json = new JsonResponse();
        $this->lastUpdate = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        return json_decode($this->json, 1);
    }

    /**
     * @param mixed $json
     */
    public function setData($data)
    {
        $this->json = json_encode($data);
    }

}