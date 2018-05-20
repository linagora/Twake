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
use WebsiteApi\WorkspacesBundle\Entity\PricingPlan;

/**
 * Created by PhpStorm.
 * User: Syma
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
            ->setDescription("Command to initialize the server, notably filling the database with crucial data")
            ->addOption(
                "ignore",
                "i",
                InputOption::VALUE_NONE,
                "Ignore errors from doctrine schema update, use only if doctrine is broken"
            );
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $starttime = microtime(true);

        $this->output = $output;
        $ignore = $input->getOption('ignore');

        /**
         * Doctrine Schema Update
         */

        $command = $this->getApplication()->find('doctrine:schema:update');

        $arguments = array(
            'command' => 'doctrine:schema:update',
            '--force' => true,
            '--complete' => true,
        );

        $greetInput = new ArrayInput($arguments);
        $returnCode = $command->run($greetInput, $output);

        if ($returnCode != 0 && !$ignore) {
            $output->writeln('ERROR (FATAL) : doctrine schema update failed, add option --ignore to execute this command without controlling the error codes');
            return 1;
        } else if ($returnCode != 0 && !$ignore) {
            $output->writeln('WARNING : doctrine schema update failed, error was ignored');
        }

        $doctrine = $this->getContainer()->get('doctrine');
        $manager = $doctrine->getManager();


        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApplication()->getKernel()->getContainer();
        $serverbase = $this->getContainer()->getParameter('SERVER_NAME');

        // Création d'un pricing minimum gratuit
        $plan = $services->get("app.pricing_plan")->getMinimalPricing();
        if (!$plan) {
            $plan = new PricingPlan("free");
            $plan->setLimitation(Array("drive" => "0"));
            $plan->setMonthPrice(0);
            $plan->setYearPrice(0);
            $manager->persist($plan);
        }
        $plan = $manager->getRepository("TwakeWorkspacesBundle:PricingPlan")->findOneBy(Array("label" => "private"));
        if (!$plan) {
            $plan = new PricingPlan("private");
            $plan->setLimitation(Array("drive" => "0"));
            $plan->setMonthPrice(0);
            $plan->setYearPrice(0);
            $manager->persist($plan);
        }

        // Création des applications de base
        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "messages"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("messages");
        $app->setName("Messages");
        $app->setDescription("The powerful Twake messaging app.");
        $app->setShortDescription("The powerful Twake messaging app.");
        $app->setUrl("messages-auto");
        $app->setUserRights(json_decode('{"general":{"create":true,"view":true,"post":true,"pin":true}}', true));
        $app->setApplicationRights(json_decode('{"messages":"manage"}', true));
        $app->setEnabled(1);
        $app->setColor("0992D6");
        $app->setCanCreateFile(0);
        $app->setIsCapable(1);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(0);
        $app->setOrder(0);

        $app->setThumbnail($serverbase . "/medias/apps/messagerie.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "drive"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("drive");
        $app->setName("Drive");
        $app->setDescription("Twake storage app.");
        $app->setShortDescription("Twake storage app.");
        $app->setUrl("drive");
        $app->setUserRights(json_decode('{"general":{"create":true,"view":true,"edit":true}}', true));
        $app->setApplicationRights(json_decode('{"drive":"manage"}', true));
        $app->setEnabled(1);
        $app->setColor("FFAC3C");
        $app->setCanCreateFile(0);
        $app->setIsCapable(1);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(1);
        $app->setOrder(0);
        $app->setThumbnail($serverbase . "/medias/apps/drive.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "calendar"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("calendar");
        $app->setName("Calendar");
        $app->setDescription("Twake calendar app.");
        $app->setShortDescription("Twake calendar app.");
        $app->setUrl("calendar");
        $app->setUserRights(json_decode('{"general":{"create":true,"view":true,"edit":true}}', true));
        $app->setApplicationRights(json_decode('{"calendar":"manage"}', true));
        $app->setEnabled(1);
        $app->setColor("E63B42");
        $app->setCanCreateFile(0);
        $app->setIsCapable(1);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(0);
        $app->setOrder(0);
        $app->setThumbnail($serverbase . "/medias/apps/calendar.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $manager->persist($app);

        $manager->flush();

        /*
         * Init pour la future mise a jour
         */


    }

}