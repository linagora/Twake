<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Model\PricingPlanInterface;

class PricingPlan implements PricingPlanInterface
{

	private $doctrine;

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function init()
	{
		$cmd = $this->doctrine->getClassMetadata('\WebsiteApi\WorkspacesBundle\Entity\PricingPlan');
		$connection = $this->doctrine->getConnection();
		$dbPlatform = $connection->getDatabasePlatform();
		$connection->query('SET FOREIGN_KEY_CHECKS=0');
		$q = $dbPlatform->getTruncateTableSql($cmd->getTableName());
		$connection->executeUpdate($q);
		$connection->query('SET FOREIGN_KEY_CHECKS=1');

		$plans = Array(
			Array(
				"name" => "startup",
				"monthlyPrice" => 9,
				"yearlyPrice" => 90
			),
			Array(
				"name" => "standard",
				"monthlyPrice" => 17,
				"yearlyPrice" => 170
			)
		);

		foreach ($plans as $plan) {
			$newPlan = new \WebsiteApi\WorkspacesBundle\Entity\PricingPlan($plan["name"]);
			$newPlan->setMonthPrice($plan["monthlyPrice"]);
			$newPlan->setYearPrice($plan["yearlyPrice"]);
			$this->doctrine->persist($newPlan);
		}
		$this->doctrine->flush();
	}

	public function getMinimalPricing()
	{
		$planRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");
		$plan = $planRepository->findOneBy(Array("id"=>1));
		return $plan;
	}

	public function getLimitations($groupId){

        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $pricingRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");

        if($group == null){
            $pricing = $pricingRepository->findOneBy(Array("label"=>"startup"));
        }else{
            $pricing = $pricingRepository->findOneBy(Array("id"=>($group->getPricingPlan())));
        }

        return $pricing;
    }

    public function getLimitation($groupId,$key,$default){
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $pricingRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");

        if($group == null){
            $pricing = $pricingRepository->findOneBy(Array("label"=>"startup"))->getAsArray();
        }else{
            $pricing = $pricingRepository->findOneBy(Array("id"=>($group->getPricingPlan())))->getAsArray();
        }

        if(isset($pricing["limitation"][$key])){
            if($pricing["limitation"][$key] == 0){
                return PHP_INT_MAX;
            }else{
                return $pricing["limitation"][$key];
            }
        }else{
            return $default;
        }

    }
}