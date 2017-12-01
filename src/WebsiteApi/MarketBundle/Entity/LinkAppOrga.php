<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Message
 *
 * @ORM\Table(name="link_app_orga",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\MarketBundle\Repository\LinkAppOrgaRepository")
 */
class LinkAppOrga
{
	/**
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
	 */
	private $application;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Orga")
	 */
	private $organization;

	/**
	 * @ORM\Column(name="price", type="float")
	 */
	private $price = 0;


	// Getter et Setter en dessous, rien d'intéressant !
	/**
	 * @return mixed
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getApplication()
	{
		return $this->application;
	}

	/**
	 * @param mixed $application
	 */
	public function setApplication($application)
	{
		$this->application = $application;
	}

	/**
	 * @return mixed
	 */
	public function getGroup()
	{
		return $this->organization;
	}

	/**
	 * @param mixed $organization
	 */
	public function setGroup($organization)
	{
		$this->organization = $organization;
	}

	/**
	 * @return mixed
	 */
	public function getPrice()
	{
		return $this->price;
	}

	/**
	 * @param mixed $price
	 */
	public function setPrice($price)
	{
		$this->price = $price;
	}


}
