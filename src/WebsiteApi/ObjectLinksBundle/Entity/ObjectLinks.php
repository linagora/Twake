<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 16/07/18
 * Time: 09:50
 */

namespace WebsiteApi\ObjectLinksBundle\Entity;


use Doctrine\ORM\Mapping as ORM;

/**
 * Class ObjectLinks
 * @package WebsiteApi\ObjectLinksBundle\Entity
 * @ORM\Table(name="objectLinks", options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ObjectLinksBundle\Repository\ObjectLinksRepository")
 */
class ObjectLinks
{

    /**
     * @ORM\Column(name="id",type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

    /**
     * @ORM\Column(type="string")
     */
    private $typeA;

    /**
     * @ORM\Column(type="integer")
     */
    private $idA;
    /**
     * @ORM\Column(type="string")
     */
    private $typeB;
    /**
     * @ORM\Column(type="integer")
     */
    private $idB;

    /**
     * @ORM\Column(type="text")
     */
    private $fieldsToSynchronised;


    /**
     * ObjectLinks constructor.
     * @param $id
     * @param $typeA
     * @param $idA
     * @param $typeB
     * @param $idB
     */
    public function __construct($typeA, $idA, $typeB, $idB)
    {
        $this->typeA = $typeA;
        $this->idA = $idA;
        $this->typeB = $typeB;
        $this->idB = $idB;
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
        return $this->typeA;
    }

    /**
     * @param mixed $typeA
     */
    public function setTypeA($typeA)
    {
        $this->typeA = $typeA;
    }

    /**
     * @return mixed
     */
    public function getIdA()
    {
        return $this->idA;
    }

    /**
     * @param mixed $idA
     */
    public function setIdA($idA)
    {
        $this->idA = $idA;
    }

    /**
     * @return mixed
     */
    public function getTypeB()
    {
        return $this->typeB;
    }

    /**
     * @param mixed $typeB
     */
    public function setTypeB($typeB)
    {
        $this->typeB = $typeB;
    }

    /**
     * @return mixed
     */
    public function getIdB()
    {
        return $this->idB;
    }

    /**
     * @param mixed $idB
     */
    public function setIdB($idB)
    {
        $this->idB = $idB;
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
        return json_decode($this->fieldsToSynchronised,1);
    }

    /**
     * @param mixed $fieldsToSynchronised
     */
    public function setFieldsToSynchronised($fieldsToSynchronised)
    {
        $this->fieldsToSynchronised = json_encode($fieldsToSynchronised);
    }
}