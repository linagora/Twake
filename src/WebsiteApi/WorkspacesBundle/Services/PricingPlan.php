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
    var $partial_cost_percentage = 0.5; //partial cost 50%
    var $total_cost_percentage = 1; //total cost 100%
    var $none = 1;
    var $partial = 10;
    var $month_length = 20;
    var $min_paid_users_percentage = 0.01; //min cost is 1%
    var $nbDays;


    public function __construct($doctrine, $groupperiodservice)
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
        error_log("**HELLO**");
        $planRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");
        $plans = $planRepository->findBy(Array());
        error_log("total = " . count($plans));
        $plan = null;
        foreach ($plans as $_plan) {
            error_log($_plan->getId());
            if (!$plan || $plan->getMonthPrice() > $_plan->getMonthPrice()) {
                $plan = $_plan;
            }
        }
        return $plan;
    }

    public function getLimitations($groupId)
    {

        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $pricingRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");

        if ($group == null) {
            $pricing = $pricingRepository->findOneBy(Array("label" => "private"));
        } else {
            if($group->getIsBlocked())
                $pricing = $this->getMinimalPricing();
            else
                $pricing = $pricingRepository->findOneBy(Array("id" => ($group->getPricingPlan())));
        }

        return $pricing;
    }

    public function getLimitation($groupId, $key, $default)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $pricingRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");

        if ($group == null || $group->getIsPrivate()) {
            $pricing = $pricingRepository->findOneBy(Array("label" => "private"))->getAsArray();
        } else {
            $pricing = $pricingRepository->findOneBy(Array("id" => ($group->getPricingPlan())))->getAsArray();
        }

        if (isset($pricing["limitation"][$key])) {
            if ($pricing["limitation"][$key] == 0) {
                return PHP_INT_MAX;
            } else {
                return $pricing["limitation"][$key];
            }
        } else {
            return $default;
        }

    }

    /**
     * Set daily data from groupUser in monthly data groupUser
     */
    public function dailyDataGroupUser()
    {
        $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $listGroupUser = $groupUserRepository->findBy(Array("didConnectToday" => 1));
        $dateToday = date('z') + 1;
        foreach ($listGroupUser as $ga) {
            $lastDate = $ga->getLastDayOfUpdate();

            if ($lastDate != $dateToday) {
                if ($ga->getDidConnectToday()) {
                    $ga->increaseConnectionsPeriod();
                    $usedApps = $ga->getUsedAppsToday();
                    $ga->setLastDayOfUpdate($dateToday);
                    foreach ($usedApps as $app) {
                        $appsUsage = $ga->getAppsUsagePeriod();
                        if ($appsUsage != null && !empty($appsUsage) &&
                            array_key_exists($app, $appsUsage)
                        ) {
                            $obj = $appsUsage;
                            $obj[$app] = $appsUsage[$app] + 1;
                            $ga->setAppsUsagePeriod($obj);
                        } else {
                            $obj = $appsUsage;
                            $obj[$app] = 1;
                            $ga->setAppsUsagePeriod($obj);
                        }
                    }
                    $ga->setUsedAppsToday([]);
                    $ga->setDidConnectToday(0);
                    $this->doctrine->persist($ga);
                }

            }

        }
        $this->doctrine->flush();
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
            $gp->setAppsUsagePeriod([]);
            $this->doctrine->persist($gp);
        }

        $this->doctrine->flush();

        foreach ($listGroupUser as $ga) {
            $groupPeriod = $groupPeriodUsageRepository->findOneBy(Array("group" => $ga->getGroup()));
            if (!$groupPeriod) {
                $this->groupPeriod->init($ga->getGroup(),$this->getMinimalPricing());
                $groupPeriod = $groupPeriodUsageRepository->findOneBy(Array("group" => $ga->getGroup()));
            }
            $connexions = $groupPeriod->getConnexions();
            $appsUsage = $groupPeriod->getAppsUsagePeriod();

            $now = new DateTime();
            $this->nbDays = $now->diff($groupPeriod->getPeriodStartedAt(), true)->format('%a');
            $calculTemps = min($this->month_length, $this->nbDays) / $this->month_length;

            $numberOfConnection = $ga->getConnectionsPeriod();

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
            $usedApps = $ga->getAppsUsagePeriod();
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
                $groupPeriod->setAppsUsagePeriod($appsUsage);
                $this->doctrine->persist($groupPeriod);
            }

            $this->doctrine->flush();

        }
        $this->calculatePrice($AllgroupPeriod);
    }

    public function calculatePrice($AllgroupPeriod)
    {
        // calcul du prix

        foreach ($AllgroupPeriod as $gp) {
            $cost = 0 ;
            $realCost = 0 ;
            $now = new DateTime();
            $this->nbDays = $now->diff($gp->getPeriodStartedAt()->setTime(0, 0, 0), true)->format('%a');
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

            $apps = $gp->getAppsUsagePeriod();
            $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");

            $appPricingRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:AppPricingInstance");
            $chargeApps=0;
            $groupAppRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $appCostTotal = 0;

            foreach ($apps as $key => $value) {
                $currentApp = $appRepository->find($key);
                $appCost = 0 ;
                if ($currentApp != null) {
                    $groupApp = $groupAppRepository->findOneBy(Array("group" => $gp->getGroup(), "app" => $currentApp));
                    $appPricing = $appPricingRepository->findOneBy(Array("groupapp" => $groupApp, "group" => $gp->getGroup()));
                    if($appPricing != null){
                        $appCost = $appPricing->getCostMonthly();

                        // Payable par utilisateur par mois
                        if (array_key_exists("none", $value)) {
                            $chargeApps += $value["none"] * $this->none_cost_percentage * $appPricing->getCostUser();
                        }
                        if (array_key_exists("partial", $value)) {
                            $chargeApps += $value["partial"] * $this->partial_cost_percentage * $appPricing->getCostUser();
                        }
                        if (array_key_exists("total", $value)) {
                            $chargeApps += $value["total"] * $this->total_cost_percentage * $appPricing->getCostUser();
                        }

                        $appCostTotal += $appCost + $chargeApps;
                    }

                }

            }

            $groupPrincingInstance = $gp->getGroupPricingInstance();
            $typeBilled = $groupPrincingInstance->getBilledType();

            $pricing = $typeBilled == "monthly" ? $groupPrincingInstance->getOriginalPricingReference()->getMonthPrice() : $groupPrincingInstance->getOriginalPricingReference()->getYearPrice();

            $cost = $chargeUsers * $pricing;

            $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $nbuserGroup = $groupUserRepository->findBy(Array("group" => $gp->getGroup()));

            $minCost = max(1, $this->min_paid_users_percentage * count($nbuserGroup)) * $pricing;
            
            $realCost = max($minCost, $cost);
            $realCost+= $appCostTotal;

            $monthDays = $this->nbDays == 0 ? 1 : $this->nbDays;
            $monthDays = $monthDays > 20 ? 20 : $monthDays;

            $monthDays = min($monthDays, $this->month_length);
            $realCostonPeriod = $realCost * $monthDays / $this->month_length;

            $gp->setCurrentCost($realCostonPeriod);
            $gp->setEstimatedCost($realCost);

            $this->doctrine->persist($gp);
            if ($gp->getCurrentCost() > 1000 + $gp->getExpectedCost()) {
                $this->groupPeriod->groupPeriodOverCost($gp);
            }

            //Test si fin period
            $date = new \DateTime();
            $date->setTime(0, 0, 0);
            $endPeriod = $gp->getPeriodExpectedToEndAt();
            $endPeriod->setTime(0, 0, 0);
            if ($date == $endPeriod) {
                $this->checkEnded($gp);
            }
            $this->doctrine->flush();
        }
    }

    public function checkEnded($gp)
    {
        $group = $gp->getGroup();
        $grouppricinginstance = $gp->getGroupPricingInstance();
        if ($grouppricinginstance != null) {
            $billingtype = $grouppricinginstance->getBilledType();
            $pricingId = $grouppricinginstance->getOriginalPricingReference();
            $this->groupPeriod->changePlanOrRenew($group, $billingtype, $pricingId);
        }
    }

}