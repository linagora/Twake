<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 16/07/18
 * Time: 09:50
 */

namespace WebsiteApi\ObjectLinksBundle\Entity;


use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

/**
 * Class ObjectLinks
 * @package WebsiteApi\ObjectLinksBundle\Entity
 * @ORM\Table(name="object_links", options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ObjectLinksBundle\Repository\ObjectLinksRepository")
 */
class ObjectLinks
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\Column(name="typea", type="string")
     */
    private $typea;

    /**
     * @ORM\Column(name="ida", type="twake_timeuuid")
     */
    private $ida;
    /**
     * @ORM\Column(name="typeb", type="string")
     */
    private $typeb;
    /**
     * @ORM\Column(name="idb", type="twake_timeuuid")
     */
    private $idb;

    /**
     * @ORM\Column(type="text")
     */
    private $fieldstosynchronised;


    /**
     * ObjectLinks constructor.
     * @param $id
     * @param $typea
     * @param $ida
     * @param $typeb
     * @param $idb
     */
    public function __construct($typea, $ida, $typeb, $idb)
    {
        $this->typea = $typea;
        $this->ida = $ida;
        $this->typeb = $typeb;
        $this->idb = $idb;
        $this->setFieldsToSynchronised(Array("from", "to", "participants"));
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getTypeA()
    {
        return $this->typea;
    }

    /**
     * @param mixed $typea
     */
    public function setTypeA($typea)
    {
        $this->typea = $typea;
    }

    /**
     * @return mixed
     */
    public function getIdA()
    {
        return $this->ida;
    }

    /**
     * @param mixed $ida
     */
    public function setIdA($ida)
    {
        $this->ida = $ida;
    }

    /**
     * @return mixed
     */
    public function getTypeB()
    {
        return $this->typeb;
    }

    /**
     * @param mixed $typeb
     */
    public function setTypeB($typeb)
    {
        $this->typeb = $typeb;
    }

    /**
     * @return mixed
     */
    public function getIdB()
    {
        return $this->idb;
    }

    /**
     * @param mixed $idb
     */
    public function setIdB($idb)
    {
        $this->idb = $idb;
    }

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "typeA" => $this->getTypeA(),
            "idA" => $this->getIdA(),
            "typeB" => $this->getTypeB(),
            "idB" => $this->getIdB(),
            "fieldsToSynchronised" => $this->getFieldsToSynchronised()
        );
    }

    /**
     * @return mixed
     */
    public function getFieldsToSynchronised()
    {
        return json_decode($this->fieldstosynchronised, 1);
    }

    /**
     * @param mixed $fieldstosynchronised
     */
    public function setFieldsToSynchronised($fieldstosynchronised)
    {
        $this->fieldstosynchronised = json_encode($fieldstosynchronised);
    }
}