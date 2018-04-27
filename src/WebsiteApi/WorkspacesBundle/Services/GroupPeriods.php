<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupManager;
use WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance;
use WebsiteApi\WorkspacesBundle\Model\GroupPeriodInterface;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;

class GroupPeriods implements GroupPeriodInterface
{

	private $doctrine;

	public function __construct($doctrine,$pricing)
	{
		$this->doctrine = $doctrine;
		$this->pricing = $pricing;
	}

    public function init($group){
        $groupPeriodRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");
        $pricing = $this->pricing->getMinimalPricing();

        $groupPeriod = $groupPeriodRepository->findOneBy(Array("group" => $group));

        if($groupPeriod){
            return false;
        }else{
            $groupPricing = new GroupPricingInstance($group ,"monthly",$pricing );
            $date = new \DateTime();
            $date->modify('+1 month');
            $groupPricing->setEndAt($date);
            $groupPeriod = new GroupPeriod($group,$groupPricing);
            $groupPeriod->setGroupPricingInstance($groupPricing);

            $this->doctrine->persist($groupPricing);
            $this->doctrine->persist($groupPeriod);
            $this->doctrine->flush();
            return true;
        }
    }
}