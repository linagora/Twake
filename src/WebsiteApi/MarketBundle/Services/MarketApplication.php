<?php

namespace WebsiteApi\MarketBundle\Services;

use WebsiteApi\MarketBundle\Model\MarketApplicationInterface;
use WebsiteApi\WorkspacesBundle\Entity\GroupApp;

class MarketApplication implements MarketApplicationInterface
{
    private $doctrine;
    private $gms;
    private $pricingPlan;
    public function __construct($doctrine, $group_managers_service, $pricing)
    {
        $this->doctrine = $doctrine;
        $this->gms = $group_managers_service;
        $this->pricingPlan = $pricing;
    }

    public function getApps()
    {
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findBy(Array('enabled'=>true),array('name' => 'ASC'), 18);

        return $applications;
    }
    public function getAppsByName($name)
    {
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findApplicationByName($name);

        return $applications;
    }

    public function getAppByPublicKey($publicKey){
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findOneBy(Array("publicKey" => $publicKey));

        return $applications;
    }

    public function addApplication($groupId,$appId, $currentUserId = null, $init = null){

        if($groupId == null || $appId == null){
            return false;
        }

        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $application = $applicationRepository->find($appId);

        $groupAppRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
        $groupApplication = $groupAppRepository->findOneBy(Array("group" => $group, "app" => $application));

        if($groupApplication!=null){
            return "app déjà existante";
        }

        $limit = $this->pricingPlan->getLimitation($groupId,"apps",PHP_INT_MAX);
        $listApp = $groupAppRepository->findBy(Array("group"=>$group));

        if(count($listApp) >= $limit){
            return "nombre d'application max atteinte" ;
        }

        if ( $currentUserId == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($groupId, $currentUserId),
                "MANAGE_APPS"
            )
        ) {
            $groupapp = new GroupApp($group, $application);
            if($init){
                if($application->getDefault()) {
                    $groupapp->setWorkspaceDefault(true);
                }
            }
            $this->doctrine->persist($groupapp);

            $application->increaseInstall();
            $this->doctrine->persist($application);

            $this->doctrine->flush();

            return true;
        }
        return false ;
    }
}