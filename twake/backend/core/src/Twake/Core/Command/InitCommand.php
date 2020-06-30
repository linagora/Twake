<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Services\DoctrineAdapter\FakeCassandraTimeuuid;
use Twake\Discussion\Entity\Channel;
use Twake\Market\Entity\Application;
use Twake\Market\Entity\LinkAppWorkspace;
use Twake\Workspaces\Entity\Level;
use Twake\Workspaces\Entity\PricingPlan;

/**
 * Date: 20/06/2017
 * Time: 09:45
 */
class InitCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    var $newApps = Array('all' => Array(), 'notall' => Array());

    protected function configure()
    {
        $this
            ->setName("twake:init")
            ->setDescription("Command to initialize the server, notably filling the database with crucial data");
    }


    protected function execute()
    {

        //TODO use configuration to choose what app to use

        $manager = $this->getApp()->getServices()->get('app.twake_doctrine');

        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApp()->getServices();

        // Création d'un pricing minimum gratuit
        error_log("> Creating basic pricings");
        $plan = $services->get("app.pricing_plan")->getMinimalPricing();
        if (!$plan) {
            $plan = new PricingPlan("standard");
            $plan->setLimitation(Array("drive" => "0"));
            $plan->setMonthPrice(0);
            $plan->setYearPrice(0);
            $manager->persist($plan);
        }
        $plan = $manager->getRepository("Twake\Workspaces:PricingPlan")->findOneBy(Array("label" => "private"));
        if (!$plan) {
            $plan = new PricingPlan("private");
            $plan->setLimitation(Array("drive" => "0"));
            $plan->setMonthPrice(0);
            $plan->setYearPrice(0);
            $manager->persist($plan);
        }

        $manager->flush();


        // Création des applications    de base
        error_log("> Creating basic apps");
        $app = null;
        $app = $manager->getRepository("Twake\Market:Application")->findOneBy(Array("simple_name" => "twake_drive"));
        if (!$app) {
            $app = new Application(new FakeCassandraTimeuuid(), "Documents");
            $app->setApiPrivateKey($app->generatePrivateApiKey());
        }
        $app->setEsIndexed(false);
        $app->setIconUrl("/public/img/twake-emoji/twake-drive.png");
        $app->setWebsite("https://twakeapp.com");
        $app->setDescription("Application de stockage de fichier de Twake.");
        $app->setSimpleName("twake_drive");
        $app->setAppGroupName("twake");
        $app->setPublic(true);
        $app->setIsAvailableToPublic(true);
        $app->setTwakeTeamValidation(true);
        $app->setDisplayConfiguration(json_decode('{"messages_module":{"in_plus":true},"channel_tab":true,"app":true}', true));
        $app->setDefault(true);
        $manager->persist($app);
        $manager->flush();

        $app = null;
        $app = $manager->getRepository("Twake\Market:Application")->findOneBy(Array("simple_name" => "twake_calendar"));
        if (!$app) {
            $app = new Application(new FakeCassandraTimeuuid(), "Calendar");
            $app->setApiPrivateKey($app->generatePrivateApiKey());
        }
        $app->setEsIndexed(false);
        $app->setIconUrl("/public/img/twake-emoji/twake-calendar.png");
        $app->setWebsite("https://twakeapp.com");
        $app->setDescription("Application calendrier partagé de Twake.");
        $app->setSimpleName("twake_calendar");
        $app->setAppGroupName("twake");
        $app->setPublic(true);
        $app->setIsAvailableToPublic(true);
        $app->setTwakeTeamValidation(true);
        $app->setDisplayConfiguration(json_decode(/*'{"messages_module":{"in_plus":true},"channel_tab":true,*/
            '{"app":true}', true));
        $app->setDefault(true);
        $manager->persist($app);
        $manager->flush();

        $app = null;
        $app = $manager->getRepository("Twake\Market:Application")->findOneBy(Array("simple_name" => "twake_tasks"));
        if (!$app) {
            $app = new Application(new FakeCassandraTimeuuid(), "Tasks");
            $app->setApiPrivateKey($app->generatePrivateApiKey());
        }
        $app->setEsIndexed(false);
        $app->setIconUrl("/public/img/twake-emoji/twake-tasks.png");
        $app->setWebsite("https://twakeapp.com");
        $app->setDescription("Application gestion de tâches de Twake.");
        $app->setSimpleName("twake_tasks");
        $app->setAppGroupName("twake");
        $app->setPublic(true);
        $app->setIsAvailableToPublic(true);
        $app->setTwakeTeamValidation(true);
        $app->setDisplayConfiguration(json_decode(/*'{"messages_module":{"in_plus":true},*/
            '{"channel_tab":true, "app":true}', true));
        $app->setDefault(true);
        $manager->persist($app);
        $manager->flush();

    }

}
