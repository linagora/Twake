<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * Group
 *
 * @ORM\Table(name="pricing_plan",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\PricingPlanRepository")
 */
class PricingPlan
{
	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	/**
	 * @ORM\Column(name="name", type="string", length=255)
	 */
	protected $label = "";

	/**
	 * @ORM\Column(name="month_price", type="float")
	 */
	protected $month_price = 0;

	/**
	 * @ORM\Column(name="year_price", type="float")
	 */
	protected $year_price = 0;


	public function __construct($name) {
		$this->label = $name;
	}

	public function getId(){
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getLabel()
	{
		return $this->label;
	}

	/**
	 * @return mixed
	 */
	public function getMonthPrice()
	{
		return $this->month_price;
	}

	/**
	 * @param mixed $month_price
	 */
	public function setMonthPrice($month_price)
	{
		$this->month_price = $month_price;
	}

	/**
	 * @return mixed
	 */
	public function getYearPrice()
	{
		return $this->year_price;
	}

	/**
	 * @param mixed $year_price
	 */
	public function setYearPrice($year_price)
	{
		$this->year_price = $year_price;
	}

	/**
	 * @param mixed $label
	 */
	public function setLabel($label)
	{
		$this->label = $label;
	}

}
