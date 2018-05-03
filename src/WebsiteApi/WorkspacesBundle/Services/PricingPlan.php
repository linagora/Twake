<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use \DateTime;
use WebsiteApi\WorkspacesBundle\Model\PricingPlanInterface;

class PricingPlan implements PricingPlanInterface
{

	private $doctrine;
	private $groupPeriod;
    var $newApps = Array('all' => Array(), 'notall' => Array());

    var $none_cost_percentage = 0; //none cost 0%
    var $partial_cost_percentage = 0.5 ; //partial cost 50%
    var $total_cost_percentage = 1; //total cost 100%
    var $none = 1;
    var $partial = 10;
    var $month_length = 20;
    var $min_paid_users_percentage = 0.01; //min cost is 1%
    var $nbDays;


	public function __construct($doctrine,$groupperiodservice)
	{
		$this->doctrine = $doctrine;
		$this->groupPeriod = $groupperiodservice;
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

    /**
     * Set daily data from groupUser in monthly data groupUser
     */
    public function dailyDataGroupUser()
    {
        $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $listGroupUser = $groupUserRepository->findBy(Array());
        $dateToday = date('z') + 1;
        foreach ($listGroupUser as $ga) {
            $lastDate = $ga->getLastDayOfUpdate();

            if ($lastDate < $dateToday){
                if ($ga->getDidConnect()) {
                    $ga->increaseConnectionPeriod();
                    $usedApps = $ga->getUsedApps();
                    $ga->setLastDayOfUpdate($dateToday);
                    foreach ($usedApps as $app) {
                        $appsUsage = $ga->getAppsUsage();
                        if ($appsUsage != null && !empty($appsUsage) &&
                            array_key_exists($app, $appsUsage)
                        ) {
                            $obj = $appsUsage;
                            $obj[$app] = $appsUsage[$app] + 1;
                            $ga->setAppsUsage($obj);
                            $this->doctrine->persist($ga);
                        } else {
                            $obj = $appsUsage;
                            $obj[$app] = 1;
                            $ga->setAppsUsage($obj);
                            $this->doctrine->persist($ga);
                        }
                    }
                    $ga->setUsedApps([]);
                    $ga->setDidConnect(0);
                    $this->doctrine->flush();
                }

            }

        }
    }

    /**
     * Update data groupPeriodUsage from groupUser monthly data
     */
    public function groupPeriodUsage()
    {
        $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $groupPeriodUsageRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");

        $listGroupUser = $groupUserRepository->findBy(Array());

        $AllgroupPeriod = $groupPeriodUsageRepository->findBy(Array());

        foreach ($AllgroupPeriod as $gp) {
            $gp->setConnexions([]);
            $gp->setAppsUsage([]);
            $this->doctrine->persist($gp);
        }

        $this->doctrine->flush();

        foreach ($listGroupUser as $ga) {
            $groupPeriod = $groupPeriodUsageRepository->findOneBy(Array("group" => $ga->getGroup()));
            $connexions = $groupPeriod->getConnexions();
            $appsUsage = $groupPeriod->getAppsUsage();

            $now = new DateTime();
            $this->nbDays = $now->diff($groupPeriod->getPeriodStartedAt(), true)->format('%a');
            $calculTemps = min($this->month_length, $this->nbDays) / $this->month_length;

            $numberOfConnection = $ga->getConnections();

            // nb connexions

            if ($numberOfConnection <= $this->none * $calculTemps) {
                if ($numberOfConnection == 0) {
                    if (array_key_exists("none", $connexions)) {
                        $connexions["none"] = $connexions["none"] + 1;
                    } else {
                        $connexions["none"] = 1;
                    }
                } else {
                    if (array_key_exists("none", $connexions)) {
                        $connexions["none"] = $connexions["none"] + 1;
                    } else {

                        $connexions["none"] = 1;
                    }
                }
            } else if ($numberOfConnection < $this->partial * $calculTemps) {
                if (array_key_exists("partial", $connexions)) {
                    $connexions["partial"] = $connexions["partial"] + 1;
                } else {
                    $connexions["partial"] = 1;
                }
            } else {
                if (array_key_exists("total", $connexions)) {
                    $connexions["total"] = $connexions["total"] + 1;
                } else {
                    $connexions["total"] = 1;
                }
            }
            $groupPeriod->setConnexions($connexions);
            $this->doctrine->persist($groupPeriod);

            //apps
            $usedApps = $ga->getAppsUsage();
            foreach ($usedApps as $app => $value) {
                if (!array_key_exists($app, $appsUsage)) {
                    $appsUsage[$app] = ["none" => 0, "partial" => 0, "total" => 0];
                }
                if ($value <= $this->none * $calculTemps) {
                    if ($value == 0) {
                        if (array_key_exists("none", $appsUsage[$app])) {
                            $appsUsage[$app]["none"] = $appsUsage[$app]["none"] + 1;
                        }
                    } else {
                        if (array_key_exists("none", $appsUsage[$app])) {
                            $appsUsage[$app]["none"] = $appsUsage[$app]["none"] + 1;
                        }
                    }
                } else if ($value < $this->partial * $calculTemps) {
                    if (array_key_exists("partial", $appsUsage[$app])) {
                        $appsUsage[$app]["partial"] = $appsUsage[$app]["partial"] + 1;
                    }
                } else {
                    if (array_key_exists("total", $appsUsage[$app])) {
                        $appsUsage[$app]["total"] = $appsUsage[$app]["total"] + 1;
                    }
                }
                $groupPeriod->setAppsUsage($appsUsage);
                $this->doctrine->persist($groupPeriod);
            }

            $this->doctrine->flush();

        }
        $this->calculatePrice($AllgroupPeriod);
    }

    public function calculatePrice($AllgroupPeriod){
        // calcul du prix
        foreach ($AllgroupPeriod as $gp) {
            $now = new DateTime();
            $this->nbDays = $now->diff($gp->getPeriodStartedAt(), true)->format('%a');
            $calculTemps = min($this->month_length, $this->nbDays) / $this->month_length;

            $connexions = $gp->getConnexions();

            $chargeUsers = 0;
            if (array_key_exists("none", $connexions)) {
                $chargeUsers += $connexions["none"] * $this->none_cost_percentage;
            }
            if (array_key_exists("partial", $connexions)) {
                $chargeUsers += $connexions["partial"] * $this->partial_cost_percentage;
            }
            if (array_key_exists("total", $connexions)) {
                $chargeUsers += $connexions["total"] * $this->total_cost_percentage;
            }

            $apps = $gp->getAppsUsage();
            $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");

            foreach ($apps as $key => $value) {
                $currentApp = $appRepository->find($key);
                $appCostTotal = 0;
                /* TODO Calculate the apps price
                 * if($currentApp!=false){
                 * if($currentApp->isPayante()) {
                        if($currentApp->PayeParMois ){
                            $appCost = $currentApp->getMonthlyCost();
                        }else{
                         // Payable par utilisateur par mois
                               if (array_key_exists("none", $value)) {
                                  $chargeUsers += $value["none"] * $this->none_cost_percentage;
                               }
                              if (array_key_exists("partial", $value)) {
                                 $chargeUsers += $value["partial"] * $this->partial_cost_percentage;
                             }
                             if (array_key_exists("total", $value)) {
                                   $chargeUsers += $value["total"] * $this->total_cost_percentage;
                            }
                        }
                $appCostTotal += $appCost ;
                    }
                }
                }*/
            }


            $groupPrincingInstance = $gp->getGroupPricingInstance();
            $typeBilled = $groupPrincingInstance->getBilledType();

            $pricing = $typeBilled == "monthly" ? $groupPrincingInstance->getOriginalPricingReference()->getMonthPrice() : $groupPrincingInstance->getOriginalPricingReference()->getYearPrice();

            $cost = $chargeUsers * $pricing; // + $appCostTotal

            $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $nbuserGroup = $groupUserRepository->findBy(Array("group" => $gp->getGroup()));

            $minCost = max(1, $this->min_paid_users_percentage * count($nbuserGroup)) * $pricing * $calculTemps;

            $realCost = max($minCost, $cost);

            $realCostonPeriod = $realCost / ($this->nbDays == 0 ? 1 : $this->nbDays) * $this->month_length;

            // var_dump(' LE COST TOTAL ' . $realCostonPeriod . " vrai cout " . $realCost . " / " . $this->nbDays  . " * " . $this->month_length ." nb jours");


            if ($gp->getCurrentEstimatedCost() > 1000 + $gp->getExpectedCost()) {
                $this->groupPeriod->groupPeriodOverCost($gp);
            }
        }
    }
}