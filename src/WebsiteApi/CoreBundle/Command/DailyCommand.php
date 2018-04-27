<?php
namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use \DateTime;


class DailyCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;
    var $APPS_SERVER;
    var $newApps = Array('all'=>Array(), 'notall'=>Array());

    var $none_cost_percentage = 0/100;
    var $partial_cost_percentage = 50/100;
    var $total_cost_percentage = 100/100;

    var $none = 1;
    var $partial = 10;
    var $month_length = 20 ;
    var $min_paid_users_percentage = 1/100;
    var $nbDays ;

    protected function configure()
    {
        $this
            ->setName("twake:usedApps");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $starttime = microtime(true);

        $this->output = $output;

        $doctrine = $this->getContainer()->get('doctrine');
        $manager = $doctrine->getManager();


        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApplication()->getKernel()->getContainer();


        $this->myFirstCron($doctrine,$manager);
        $this->mySecondCron($doctrine,$manager,$services);

    }

    /**
     * Set daily data from groupUser in monthly data groupUser
     * @param $doctrine
     * @param $manager
     */
    public function myFirstCron($doctrine,$manager){
        $groupUserRepository = $doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $listGroupUser = $groupUserRepository->findBy(Array());
        $dateToday = date('z') + 1;
        foreach ($listGroupUser as $ga){
            $lastDate = $ga->getLastDayOfUpdate();

            if($lastDate == $dateToday){

            }else{
                if($ga->getDidConnect()){
                    $ga->increaseConnectionPeriod();
                    $usedApps = $ga->getUsedApps();
                    $ga->setLastDayOfUpdate($dateToday);
                    foreach ($usedApps as $app){
                        $appsUsage = $ga->getAppsUsage() ;
                        if($appsUsage != null && !empty($appsUsage) &&
                            array_key_exists($app,$appsUsage)){
                            $obj = $appsUsage;
                            $obj[$app] = $appsUsage[$app] +1;
                            $ga->setAppsUsage($obj);
                            $manager->persist($ga);
                        }else{
                            $obj = $appsUsage;
                            $obj[$app] = 1;
                            $ga->setAppsUsage($obj);
                            $manager->persist($ga);
                        }
                    }
                    $ga->setUsedApps([]);
                    $ga->setDidConnect(0);
                    $manager->flush();
                }

            }

        }
    }

    /**
     * Update data groupPeriodUsage from groupUser monthly data
     * @param $doctrine
     * @param $manager
     */
    public function mySecondCron($doctrine,$manager,$services){
        $groupUserRepository = $doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $groupPeriodUsageRepository = $doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");

        $listGroupUser = $groupUserRepository->findBy(Array());

        $AllgroupPeriod = $groupPeriodUsageRepository->findBy(Array());

        foreach ($AllgroupPeriod as $gp) {
            $gp->setConnexions([]);
            $gp->setAppsUsage([]);
            $manager->persist($gp);
        }

        $manager->flush();
        foreach ($listGroupUser as $ga) {
            $groupPeriod = $groupPeriodUsageRepository->findOneBy(Array("group"=>$ga->getGroup()));
            $connexions = $groupPeriod->getConnexions();
            $appsUsage = $groupPeriod->getAppsUsage();

            $numberOfConnection = $ga->getConnections();

            // nb connexions
            if($numberOfConnection <= $this->none * min(20,$this->nbDays) / 20){
                if($numberOfConnection == 0){
                    if(array_key_exists("none",$connexions)){
                        $connexions["none"] = $connexions["none"] + 1 ;
                    }else{
                        $connexions["none"] = 1 ;
                    }
                }else{
                    if(array_key_exists("none",$connexions)){
                        $connexions["none"] = $connexions["none"] + 1 ;
                    }else{

                        $connexions["none"] = 1 ;
                    }
                }
            }else if($numberOfConnection < $this->partial * min(20,$this->nbDays) / 20){
                if(array_key_exists("partial",$connexions)){
                    $connexions["partial"] = $connexions["partial"] + 1 ;
                }else{
                    $connexions["partial"] = 1 ;
                }
            }else{
                if(array_key_exists("total",$connexions)){
                    $connexions["total"] = $connexions["total"] + 1 ;
                }else{
                    $connexions["total"] = 1 ;
                }
            }
            $groupPeriod->setConnexions($connexions);
            $manager->persist($groupPeriod);

            //apps

            $usedApps = $ga->getAppsUsage();
            foreach ($usedApps as $app => $value ){
                if(!array_key_exists($app,$appsUsage)){
                    $appsUsage[$app] = ["none"=>0,"partial"=>0,"total"=>0];
                }
                if($value <= $this->none * min(20,$this->nbDays) / 20){
                    if($value == 0){
                        if(array_key_exists("none",$appsUsage[$app] )){
                            $appsUsage[$app]["none"] = $appsUsage[$app]["none"] + 1 ;
                        }
                    }else{
                        if(array_key_exists("none",$appsUsage[$app] )){
                            $appsUsage[$app]["none"] = $appsUsage[$app]["none"] + 1 ;
                        }
                    }
                }else if($value < $this->partial * min(20,$this->nbDays) / 20){
                    if(array_key_exists("partial",$appsUsage[$app] )){
                        $appsUsage[$app]["partial"] = $appsUsage[$app]["partial"] + 1 ;
                    }
                }else{
                    if(array_key_exists("total",$appsUsage[$app] )) {
                        $appsUsage[$app]["total"] = $appsUsage[$app]["total"] + 1;
                    }
                }
                $groupPeriod->setAppsUsage($appsUsage);
                $manager->persist($groupPeriod);
            }

            $manager->flush();

        }


        // calcul du prix
        foreach($AllgroupPeriod as $gp){
            $now = new DateTime();
            $this->nbDays = $now->diff($gp->getPeriodStartedAt(),true)->format('%a');


            $connexions = $gp->getConnexions() ;

            $costUsers = 0;
            if(array_key_exists("none",$connexions)){
                $costUsers+=$connexions["none"] * $this->none_cost_percentage;
            }
            if(array_key_exists("partial",$connexions)){
                $costUsers+=$connexions["partial"] / $this->partial_cost_percentage;
            }
            if(array_key_exists("total",$connexions)){
                $costUsers+=$connexions["total"] * $this->total_cost_percentage;
            }

            // TODO
            // Calculate the apps price

            $apps = $gp->getAppsUsage() ;
            $appRepository = $doctrine->getRepository("TwakeMarketBundle:Application");

            foreach($apps as $key => $value){
                $currentApp = $appRepository->find($key);
                $appCost = 0 ;
                /* TODO !
                 * if($currentApp->isPayante()){
                        if($currentApp->PayeParMois ){
                            $appCost = $currentApp->getMonthlyCost();
                        }else{
                        // Payable par an
                    }
                }*/
            }



            $groupPrincingInstance = $gp->getGroupPricingInstance();
            $typeBilled = $groupPrincingInstance->getBilledType();

            $pricing = $typeBilled == "monthly" ? $groupPrincingInstance->getOriginalPricingReference()->getMonthPrice() :$groupPrincingInstance->getOriginalPricingReference()->getYearPrice()  ;

            $cost = $costUsers * $pricing ; // + $costApps * coutApp

            $groupUserRepository = $doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $nbuserGroup = $groupUserRepository->findBy(Array("group" => $gp->getGroup()));

            $minCost = max(1,$this->min_paid_users_percentage * count($nbuserGroup))* $pricing * min(20,$this->nbDays) / 20;

            $realCost = max($minCost,$cost);

            $realCostonPeriod = $realCost / ($this->nbDays == 0 ? 1 : $this->nbDays) * $this->month_length ;
            var_dump('OULALA LE GROS COST ' . $realCostonPeriod . " max de ça " . $minCost . " et " . $cost . " pour le mois");

            // TODO tout le monde dans total ????

           // remise a 0 après payements
           // $gp->setConnexions([]);
           // $gp->setAppsUsage([]);


        if($groupPeriod->getCurrentEstimatedCost() > 1000 + $groupPeriod->getExpectedCost()){
            // appel du service
        }

    }
    }

}