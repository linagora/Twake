<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Model\PricingPlanInterface;

class PricingPlan implements PricingPlanInterface
{

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function init()
	{
		// TODO: Implement init() method.
	}
}