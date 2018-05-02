<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\ArchivedGroupPeriod;
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

	public function changePlanOrRenew($group, $billingType ,$planId){

        $groupPricingInstanceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPricingInstance");
        $groupPricingInstance = $groupPricingInstanceRepository->findOneBy(Array("group" => $group));

        $groupPeriodRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");
        $groupPeriod = $groupPeriodRepository->findOneBy(Array("group" => $group));

        $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $groupUsers = $groupUserRepository->findBy(Array("group" => $group));

        $pricingRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");
        $pricing = $pricingRepository->findOneBy(Array("id" => $planId));

        if(!$groupPeriod){
            return false;
        }else{

            $archivedGroupPeriod = new ArchivedGroupPeriod($groupPeriod);
            $newGroupPricing = new GroupPricingInstance($group ,$billingType,$pricing );
            $date = new \DateTime();

            if ($billingType == "monthly"){
                $date->modify('+1 month');
            }
            if ($billingType == "yearly"){
                $date->modify('+1 year');
            }

            $newGroupPricing->setEndAt($date);
            $newGroupPeriod = new GroupPeriod($group);
            $newGroupPeriod->setGroupPricingInstance($newGroupPricing);

            if($groupPricingInstance){
                $this->doctrine->remove($groupPricingInstance);
            }
            $this->doctrine->remove($groupPeriod);

            //TODO CALCUL COUT ET FAIRE PAYER (UN JOUR P-Ê)

            //Reset user period utilisation
            foreach ($groupUsers as $groupUser){//User left between two periods, it can be removed
                if ($groupUser->getNbWorkspace() == 0){
                    $this->doctrine->remove($groupUser);
                }else{
                    $groupUser->setConnections(0);
                    $groupUser->setUsedApps(Array());
                    $this->doctrine->persist($groupUser);
                }
            }

            $this->doctrine->persist($archivedGroupPeriod);
            $this->doctrine->persist($newGroupPricing);
            $this->doctrine->persist($newGroupPeriod);
            $this->doctrine->flush();
            return true;
        }


    }

    public function groupPeriodOverCost($groupPeriod){

        $archivedGroupPeriod = new ArchivedGroupPeriod($groupPeriod);
        $newGroupPeriod = new GroupPeriod($groupPeriod->getGroup());
        $date = new \DateTime();
        $date->modify('+1 day');
        $newGroupPeriod->setPeriodStartedAt($date);
        $newGroupPeriod->setGroupPricingInstance($groupPeriod->getGroupPricingInstance());

        $this->doctrine->remove($groupPeriod);
        $this->doctrine->persist($archivedGroupPeriod);
        $this->doctrine->persist($newGroupPeriod);
        $this->doctrine->flush();
    }


    public function endGroupPricing($groupPricing){

        $group = $groupPricing->getGroup();
        $group->setPricingPlan(null);

        $groupPeriodRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");
        $groupPeriod = $groupPeriodRepository->findOneBy(Array("group" => $group));

        $groupPeriod->setGroupPricingInstance(null);

        $this->doctrine->persist($groupPeriod);
        $this->doctrine->persist($group);
        $this->doctrine->remove($groupPricing);
        $this->doctrine->flush();
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