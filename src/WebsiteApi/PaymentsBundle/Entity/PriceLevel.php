<?php

namespace WebsiteApi\PaymentsBundle\Entity;

use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * PriceLevel
 *
 * @ORM\Table(name="price_level",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\PaymentsBundle\Repository\PriceLevelRepository")
 */
class PriceLevel
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

	/**
     * @ORM\Column(type="string")
	 */
	private $name;

	/**
     * @ORM\Column(type="decimal")
	 */
	private $price;


	public function __construct($name, $price) {
		$this->setName($name);
		$this->setPrice($price);
	}

	public function getId() {
		return $this->id;
	}

	public function getName() {
		return $this->name;
	}

	public function setName($name) {
		$this->name = $name;
	}

	public function getPrice() {
		return $this->price;
	}

	public function setPrice($price) {
		$this->price = $price;
	}

    public function getAsArray(){
        return Array(  "id" => $this->getId(),
        "name" => $this->getName(),
        "price" => $this->getPrice() );
    }
}
