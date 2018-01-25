<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service PricingPlan
 */
interface PricingPlanInterface
{

	// @init pricings
	public function init();

	// @getMinimalPricing return a pricing plan
	public function getMinimalPricing();

}