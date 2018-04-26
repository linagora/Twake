<?php
namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\Level;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\PaymentsBundle\Entity\PriceLevel;
use WebsiteApi\UploadBundle\Entity\File;
use Symfony\Component\Console\Helper\ProgressBar;

class DailyCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;
    var $APPS_SERVER;
    var $newApps = Array('all'=>Array(), 'notall'=>Array());

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
        $this->mySecondCron($doctrine,$manager);



    }

    public function mySecondCron($doctrine,$manager){
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

            if($numberOfConnection <=1){
                if(array_key_exists("none",$connexions)){
                    $connexions["none"] = $connexions["none"] + $numberOfConnection ;
                }else{
                    $connexions["none"] = $numberOfConnection ;
                }
            }else if($numberOfConnection <10){
                if(array_key_exists("partial",$connexions)){
                    $connexions["partial"] = $connexions["partial"] + $numberOfConnection ;
                }else{
                    $connexions["partial"] = $numberOfConnection ;
                }
            }else{
                if(array_key_exists("total",$connexions)){
                    $connexions["total"] = $connexions["total"] + $numberOfConnection ;
                }else{
                    $connexions["total"] = $numberOfConnection ;
                }
            }
            $groupPeriod->setConnexions($connexions);
            $manager->persist($groupPeriod);

            $usedApps = $ga->getUsedApps();
            foreach ($usedApps as $app => $value ){
                if($value <=1){
                    if(array_key_exists("none",$appsUsage)){
                        $appsUsage["none"] = $appsUsage["none"] + $value ;
                    }else{
                        $appsUsage["none"] = $value ;
                    }
                }else if($value <10){
                    if(array_key_exists("partial",$appsUsage)){
                        $appsUsage["partial"] = $appsUsage["partial"] + $value ;
                    }else{
                        $appsUsage["partial"] = $value ;
                    }
                }else{
                    if(array_key_exists("total",$appsUsage)){
                        $appsUsage["total"] = $appsUsage["total"] + $value ;
                    }else{
                        $appsUsage["total"] = $value ;
                    }
                }
                $groupPeriod->setAppsUsage($appsUsage);
                $manager->persist($groupPeriod);
            }
            // mettre a jour currentEstimatedCost
            // calculer % de clef (none/partial..) * nb gens dedans
            // valeur min =
            //              max ( 1, 1%*nbUsers ) * pricing
            //valeur final = max (valeur Min, )

            if($groupPeriod->getCurrentEstimatedCost() > 1000 + $groupPeriod->getExpectedCost()){

            }
            $manager->flush();
            // test si estimated_cost > const + expected_cost
        }
    }

}