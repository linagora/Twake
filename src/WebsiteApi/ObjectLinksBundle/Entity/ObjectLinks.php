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
 * @ORM\Table(name="objectLinks", option={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ObjectLinksBundle\Repository\ObjectLinksRepository")
 */
class ObjectLinks
{

    /**
     * @ORM\Column(name="id",type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(name="typeA", type="string")
     */
    private $typeA;

    /**
     * @ORM\Column(name="idA", type="integer")
     */
    private $idA;
    /**
     * @ORM\Column(name="typeB", type="string")
     */
    private $typeB;
    /**
     * @ORM\Column(name="idB", type="integer")
     */
    private $idB;

    /**
     * ObjectLinks constructor.
     * @param $id
     * @param $typeA
     * @param $idA
     * @param $typeB
     * @param $idB
     */
    public function __construct($id, $typeA, $idA, $typeB, $idB)
    {
        $this->id = $id;
        $this->typeA = $typeA;
        $this->idA = $idA;
        $this->typeB = $typeB;
        $this->idB = $idB;
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
            "idB" => $this->getIdB()
        );
    }
}