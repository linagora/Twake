<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\ClosedGroupPeriod;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupManager;
use WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance;
use WebsiteApi\WorkspacesBundle\Model\GroupPeriodInterface;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;

class GroupPeriods implements GroupPeriodInterface
{

	private $doctrine;

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
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

            $closedGroupPeriod = new ClosedGroupPeriod($groupPeriod);
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
            // Si payement OK
            $closedGroupPeriod->setBilled(true);
            // Sinon
            // $closedGroupPeriod->setBilled(false);

            //Reset user period utilisation
            foreach ($groupUsers as $groupUser){//User left group between two periods, it can be removed
                if ($groupUser->getNbWorkspace() == 0){
                    $this->doctrine->remove($groupUser);
                }else{
                    $groupUser->setConnections(0);
                    $groupUser->setUsedApps(Array());
                    $this->doctrine->persist($groupUser);
                }
            }

            $this->doctrine->persist($closedGroupPeriod);
            $this->doctrine->persist($newGroupPricing);
            $this->doctrine->persist($newGroupPeriod);
            $this->doctrine->flush();
            return true;
        }


    }

    public function groupPeriodOverCost($groupPeriod){

        $closedGroupPeriod = new ClosedGroupPeriod($groupPeriod);

        $newGroupPeriod = new GroupPeriod($groupPeriod->getGroup());
        $date = new \DateTime();
        $date->modify('+1 day');
        $newGroupPeriod->setPeriodStartedAt($date);

        $newGroupPeriod->setPeriodExpectedToEndAt($groupPeriod->getPeriodExpectedToEndAt());
        $newGroupPeriod->setGroupPricingInstance($groupPeriod->getGroupPricingInstance());

        //TODO FAIRE PAYER
        // Si payement OK
        $closedGroupPeriod->setBilled(true);
        // Sinon
        // $closedGroupPeriod->setBilled(false);

        $this->doctrine->remove($groupPeriod);
        $this->doctrine->persist($closedGroupPeriod);
        $this->doctrine->persist($newGroupPeriod);
        $this->doctrine->flush();
    }


    public function endGroupPricing($groupPeriod){

        $group = $groupPeriod->getGroup();
        $group->setPricingPlan(null);

        $groupPricing = $groupPeriod->getGroupPricingInstance();
        $groupPeriod->setGroupPricingInstance(null);
        $groupPeriod->setCurrentCost(0);

        $closedGroupPeriod = new ClosedGroupPeriod($groupPeriod);
        $closedGroupPeriod->setBilled(false);

        $this->doctrine->persist($groupPeriod);
        $this->doctrine->persist($group);
        $this->doctrine->persist($closedGroupPeriod);
        $this->doctrine->remove($groupPricing);
        $this->doctrine->flush();
    }

    public function init($group){
        $groupPeriodRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");
        $planRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");
        $pricing = $planRepository->findOneBy(Array("id"=>1));

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