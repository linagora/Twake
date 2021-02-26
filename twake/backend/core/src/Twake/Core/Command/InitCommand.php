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

        @file_put_contents("/twake.status.init", "0");

        $manager = $this->getApp()->getServices()->get('app.twake_doctrine');

        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApp()->getServices();

        // Création des applications    de base
        error_log("> Creating basic apps");

        $configuration = $this->getApp()->getContainer()->getParameter("defaults.applications.twake_drive");
        $app = null;
        $app = $manager->getRepository("Twake\Market:Application")->findOneBy(Array("simple_name" => "twake_drive"));
        if (!$app) {
            $app = new Application(new FakeCassandraTimeuuid(), "Documents");
            $app->setApiPrivateKey($app->generatePrivateApiKey());
        }
        $app->setEsIndexed(false);
        $app->setIconUrl("/public/img/twake-emoji/twake-drive.png");
        $app->setWebsite("https://twakeapp.com");
        $app->setDescription("Twake file storage application.");
        $app->setSimpleName("twake_drive");
        $app->setAppGroupName("twake");
        $app->setPublic(!!$configuration);
        $app->setIsAvailableToPublic(!!$configuration);
        $app->setTwakeTeamValidation(!!$configuration);
        $app->setDisplayConfiguration(json_decode('{"messages_module":{"in_plus":true},"channel_tab":true,"app":true}', true));
        $app->setDefault(isset($configuration["default"]) && $configuration["default"]);
        $manager->persist($app);
        $manager->flush();

        $configuration = $this->getApp()->getContainer()->getParameter("defaults.applications.twake_calendar");
        $app = null;
        $app = $manager->getRepository("Twake\Market:Application")->findOneBy(Array("simple_name" => "twake_calendar"));
        if (!$app) {
            $app = new Application(new FakeCassandraTimeuuid(), "Calendar");
            $app->setApiPrivateKey($app->generatePrivateApiKey());
        }
        $app->setEsIndexed(false);
        $app->setIconUrl("/public/img/twake-emoji/twake-calendar.png");
        $app->setWebsite("https://twakeapp.com");
        $app->setDescription("Twake's shared calendar app.");
        $app->setSimpleName("twake_calendar");
        $app->setAppGroupName("twake");
        $app->setPublic(!!$configuration);
        $app->setIsAvailableToPublic(!!$configuration);
        $app->setTwakeTeamValidation(!!$configuration);
        $app->setDisplayConfiguration(json_decode(/*'{"messages_module":{"in_plus":true},*/
            '{"app":true, "channel_tab": true}', true));
        $app->setDefault(isset($configuration["default"]) && $configuration["default"]);
        $manager->persist($app);
        $manager->flush();

        $configuration = $this->getApp()->getContainer()->getParameter("defaults.applications.twake_tasks");
        $app = null;
        $app = $manager->getRepository("Twake\Market:Application")->findOneBy(Array("simple_name" => "twake_tasks"));
        if (!$app) {
            $app = new Application(new FakeCassandraTimeuuid(), "Tasks");
            $app->setApiPrivateKey($app->generatePrivateApiKey());
        }
        $app->setEsIndexed(false);
        $app->setIconUrl("/public/img/twake-emoji/twake-tasks.png");
        $app->setWebsite("https://twakeapp.com");
        $app->setDescription("Twake task management application.");
        $app->setSimpleName("twake_tasks");
        $app->setAppGroupName("twake");
        $app->setPublic(!!$configuration);
        $app->setIsAvailableToPublic(!!$configuration);
        $app->setTwakeTeamValidation(!!$configuration);
        $app->setDisplayConfiguration(json_decode(/*'{"messages_module":{"in_plus":true},*/
            '{"channel_tab":true, "app":true}', true));
        $app->setDefault(isset($configuration["default"]) && $configuration["default"]);
        $manager->persist($app);
        $manager->flush();

        @file_put_contents("/twake.status.init", "1");

    }

}
