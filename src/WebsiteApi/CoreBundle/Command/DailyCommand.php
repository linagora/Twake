<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;


class DailyCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    protected function configure()
    {
        $this
            ->setName("twake:daily");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $this->output = $output;


        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApplication()->getKernel()->getContainer();
        $manager = $services->get('app.twake_doctrine');

        $services->get("app.pricing_plan")->dailyDataGroupUser();
        $services->get("app.pricing_plan")->groupPeriodUsage();

        /* Send usage report */

        $licenceServer = "https://licences.twakeapp.com/api";
        $licenceKey = $this->getContainer()->getParameter('LICENCE_KEY');
        $data = Array(
            "licenceKey" => $licenceKey
        );
        $result = $services->get("twake.restclient")->post($licenceServer . "/verify", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60));
        $result = json_decode($result->getContent(), true);

        if ($result["status"] != "valid") {
            error_log("/!\\ LICENCE KEY INVALID, PLEASE CONTACT TWAKE !");
            error_log("=> " . json_encode($result));

            //Lock Twake installation
            // TODO

        } else {

            //Unlock Twake installation
            // TODO

            //Send report
            $report = Array(
                "apps" => Array(),
                "groups" => Array()
            );

            /** @var Application[] $apps */
            $apps = $manager->getRepository("TwakeMarketBundle:Application")->findBy(Array());
            foreach ($apps as $app) {
                $report["apps"][] = $app->getAsArray();
            }

            /** @var Group[] $groups */
            $groups = $manager->getRepository("TwakeWorkspacesBundle:Group")->findBy(Array());
            foreach ($groups as $group) {
                $report["groups"][$group->getId() . ""] = Array(
                    "name" => $group->getDisplayName(),
                    "unique_name" => $group->getName(),
                    "workspaces" => 0,
                    "usage" => Array()
                );

                $workspaces = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array("group" => $group, "is_deleted" => 0));
                $report["groups"][$group->getId() . ""]["workspaces"] = count($workspaces);

                /** @var GroupPeriod $group_period */
                $group_period = $manager->getRepository("TwakeWorkspacesBundle:GroupPeriod")->findOneBy(Array("group" => $group));
                if ($group_period) {
                    $report["groups"][$group->getId() . ""]["usage"] = Array(
                        "apps_usage" => $group_period->getAppsUsagePeriod(),
                        "connexions" => $group_period->getConnexions()
                    );
                }

            }


            $data = Array(
                "licenceKey" => $licenceKey,
                "report" => $report
            );
            $result = $services->get("twake.restclient")->post($licenceServer . "/report", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 600));

        }

    }


}