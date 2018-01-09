<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Message
 *
 * @ORM\Table(name="link_app_workspace",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\MarketBundle\Repository\LinkAppWorkspaceRepository")
 */
class LinkAppWorkspace
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

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
		return $this->workspace;
	}

	/**
	 * @param mixed $workspace
	 */
	public function setGroup($workspace)
	{
		$this->workspace = $workspace;
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
