<?php

namespace WebsiteApi\PaymentsBundle\Entity;

use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * PaymentsHistory
 *
 * @ORM\Table(name="payments_history",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\PaymentsBundle\Repository\PaymentsHistoryRepository")
 */
class PaymentsHistory
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date;

	/**
	 * @ORM\Column(type="decimal")
	 */
	private $price;


	public function __construct($workspace, $price) {
		$this->setPrice($price);
		$this->setDate(new \DateTime());
		$this->setWorkspace($workspace);
	}

	public function getId() {
		return $this->id;
	}

	public function getDate() {
		return $this->date;
	}

	public function setDate($date) {
		return $this->setDate($date);
	}

	public function getWorkspace() {
		return $this->workspace;
	}

	public function setWorkspace($workspace) {
		$this->workspace = $workspace;
	}

	public function getPrice() {
		return $this->price;
	}

	public function setPrice($price) {
		$this->price = $price;
	}

	public function getAsSimpleArray() {

		return Array(
			"id" => $this->getId(),
			"price" => $this->getPrice(),
			"date" => $this->getDate()->getTimestamp(),
			"groupId" => $this->getWorkspace()->getId()
		);
	}
}

