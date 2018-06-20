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
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "post":true, "pin":true}}', true));
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
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
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
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
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


        $apps = [
            @["/medias/apps/web/vectr.png", "Vectr", "vectr.com", "vectr", "E63B42", Array()],
            @["/medias/apps/web/webflow.jpeg", "Webflow", "webflow.com", "webflow", "E63B42", Array()],
            ["/medias/apps/web/witeboard.jpeg", "Witeboard", "witeboard.com", "witeboard", "E63B42", Array()],
            ["/medias/apps/web/flat_io.jpeg", "Flat.io", "flat.io/score", "flat_io", "E63B42", Array()],
            ["/medias/apps/web/play_canvas.jpeg", "Play Canvas", "playcanvas.com/editor", "playcanvas", "E63B42", Array()],
            ["/medias/apps/web/tuzzit_board.jpeg", "Tuzzit", "board.tuzzit.com", "board.tuzzit", "E63B42", Array()],
            ["/medias/apps/web/hackmd.jpeg", "HackMd", "hackmd.io", "hackmd", "E63B42", Array()],
            ["/medias/apps/web/trello.jpeg", "Trello", "trello.com", "trello", "E63B42", Array()],
            ["/medias/apps/web/gitlab.jpeg", "Gitlab", "gitlab.com", "gitlab", "E63B42", Array()],
            ["/medias/apps/web/github.jpeg", "Github", "github.com", "github", "E63B42", Array()],

            //Altassian
            ["/medias/apps/web/atlassian.jpeg", "Atlassian", "atlassian.net/projects", "atlassian", "E63B42", Array()],

            //gSuite
            @["/medias/apps/web/google_hangouts.png", "Google Hangouts", "hangouts.google.com", "hangouts.google", "E63B42", Array()],
            ["/medias/apps/web/google_sites.jpeg", "Google Sites", "sites.google.com", "sites.google", "E63B42", Array()],
            @["/medias/apps/web/google_docs_document.png", "Google Docs Document", "docs.google.com/document", "document.docs.google", "E63B42", Array()],
            @["/medias/apps/web/google_docs_spreadsheets.png", "Google Docs Spreadsheets", "docs.google.com/spreadsheets", "spreadsheets.docs.google", "E63B42", Array()],
            @["/medias/apps/web/google_docs_presentation.png", "Google Docs Presentation", "docs.google.com/presentation", "presentation.docs.google", "E63B42", Array()],
            ["/medias/apps/web/google_docs_drawings.jpeg", "Google Docs Drawings", "docs.google.com/drawings", "drawings.docs.google", "E63B42", Array()],
            @["/medias/apps/web/google_docs_forms.png", "Google Docs Forms", "docs.google.com/forms", "forms.docs.google", "E63B42", Array()],
            @["/medias/apps/web/google_gmail.png", "Gmail", "mail.google.com", "mail.google", "E63B42", Array()],

            //apple
            ["/medias/apps/web/icloud_keynote.jpeg", "iCloud Keynote", "icloud.com/keynote", "keynote.icloud", "E63B42", Array()],
            ["/medias/apps/web/icloud_numbers.jpeg", "iCloud Numbers", "icloud.com/numbers", "numbers.icloud", "E63B42", Array()],
            ["/medias/apps/web/icloud_pages.jpeg", "iCloud Pages", "icloud.com/pages", "pages.icloud", "E63B42", Array()],
            ["/medias/apps/web/icloud_notes.jpeg", "iCloud Notes", "icloud.com/#notes", "notes.icloud", "E63B42", Array()],
            ["/medias/apps/web/icloud_reminders.jpeg", "iCloud Reminders", "icloud.com/#reminders", "reminders.icloud", "E63B42", Array()],
            ["/medias/apps/web/icloud_contacts.jpeg", "iCloud Contacts", "icloud.com/#contacts", "contacts.icloud", "E63B42", Array()],
            ["/medias/apps/web/icloud_photos.jpeg", "iCloud Photos", "icloud.com/#photos", "photos.icloud", "E63B42", Array()],

            //Microsoft
            ["/medias/apps/web/office_365_skype.jpeg", "Skype", "web.skype.com", "skype", "E63B42", Array()],
            ["/medias/apps/web/office_365_calendar.jpeg", "Outlook Calendar", "outlook.live.com/calendar", "calendar.office_365", "E63B42", Array()],
            ["/medias/apps/web/office_365_outlook.jpeg", "Outlook ", "outlook.live.com/mail", "outlook.office_365", "E63B42", Array()],
            ["/medias/apps/web/office_365_contacts.jpeg", "Outlook Contacts", "outlook.live.com/people", "contacts.office_365", "E63B42", Array()],
            ["/medias/apps/web/office_365_sway.jpeg", "Sway", "sway.com", "sway.office_365", "E63B42", Array()],
            ["/medias/apps/web/office_365_onenote.jpeg", "OneNote", "onedrive.live.com/onenote", "onenote.office_365", "E63B42", Array()],
            ["/medias/apps/web/office_365_powerpoint.jpeg", "PowerPoint", "onedrive.live.com/powerpoint", "powerpoint.office_365", "E63B42", Array()],
            ["/medias/apps/web/office_365_word.jpeg", "Word", "onedrive.live.com/word", "word.office_365", "E63B42", Array()],
            ["/medias/apps/web/office_365_excel.jpeg", "Excel", "onedrive.live.com/excel", "excel.office_365", "E63B42", Array()],


        ];

        foreach ($apps as $application){
            $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => $application[3]));
            if (!$app) {
                $app = new Application();
            }
            $app->setPublicKey($application[3]);
            $app->setName($application[1]);
            $app->setDescription("");
            $app->setShortDescription("");
            $app->setUrl(null);
            $app->setDomainName($application[2]);
            $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
            $app->setApplicationRights(json_decode('{}', true));
            $app->setEnabled(1);
            $app->setColor($application[4]);
            $app->setCanCreateFile(0);
            $app->setIsCapable(0);
            $app->setDefault(1);
            $app->setCreateFileData(json_decode("", true));
            $app->setMessageModule(0);
            $app->setOrder(2);
            $app->setThumbnail($serverbase .$application[0] );
            $app->setMessageModuleUrl("");
            $app->setEditableRights(0);
            $app->setCgu("");
            $manager->persist($app);
        }

        $manager->flush();

        /*
         * Init pour la future mise a jour
         */


    }

}