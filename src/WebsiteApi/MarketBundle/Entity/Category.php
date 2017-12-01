<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Message
 *
 * @ORM\Table(name="Category",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\MarketBundle\Repository\CategoryRepository")
 */
class Category
{
  /**
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="AUTO")
   */
  private $id;

  /**
   * @ORM\Column(type="string", length=255)
   */
  private $name;

  function getId(){
      return $this->id;
  }

  function getName(){
      return $this->name;
  }
  function setName($x){
      $this->name = $x;
  }

  function getAsArray(){
      return Array(
          "id" => $this->getId(),
          "name" => $this->getName(),
      );
  }

}
