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

        $app->setThumbnail($serverbase . "/medias/apps/messages.png");
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

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "tasks"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("tasks");
        $app->setName("Tasks");
        $app->setDescription("Twake tasks manager.");
        $app->setShortDescription("Twake tasks manager.");
        $app->setUrl("tasks");
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
        $app->setApplicationRights(json_decode('{"tasks":"manage"}', true));
        $app->setEnabled(1);
        $app->setColor("51B75B");
        $app->setCanCreateFile(0);
        $app->setIsCapable(1);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(0);
        $app->setOrder(0);
        $app->setThumbnail($serverbase . "/medias/apps/tasks.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "imageviewer"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("imageviewer");
        $app->setName("Image viewer");
        $app->setDescription("Twake imageviewer app.");
        $app->setShortDescription("Twake imageviewer app.");
        $app->setUrl("imageviewer");
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
        $app->setApplicationRights(json_decode('{"drive":"read"}', true));
        $app->setEnabled(1);
        $app->setColor("424a60");
        $app->setCanCreateFile(0);
        $app->setIsCapable(0);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(0);
        $app->setOrder(0);
        $app->setThumbnail($serverbase . "/medias/apps/images_viewer.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $app->setFilesTypes(Array("main" => Array("png","jpg","jpeg","gif","bmp","tiff"), "other" => Array()));
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "pdfviewer"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("pdfviewer");
        $app->setName("PDF viewer");
        $app->setDescription("Twake pdfviewer app.");
        $app->setShortDescription("Twake pdfviewer app.");
        $app->setUrl("pdfviewer");
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
        $app->setApplicationRights(json_decode('{"drive":"read"}', true));
        $app->setEnabled(1);
        $app->setColor("ff4c4f");
        $app->setCanCreateFile(0);
        $app->setIsCapable(0);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(0);
        $app->setOrder(0);
        $app->setThumbnail($serverbase . "/medias/apps/pdf_viewer.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $app->setFilesTypes(Array("main" => Array("pdf"), "other" => Array()));
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "note"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("note");
        $app->setName("Note");
        $app->setDescription("Twake note app.");
        $app->setShortDescription("Twake note app.");
        $app->setUrl("note");
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
        $app->setApplicationRights(json_decode('{"drive":"read"}', true));
        $app->setEnabled(1);
        $app->setColor("545e73");
        $app->setCanCreateFile(0);
        $app->setIsCapable(0);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(0);
        $app->setOrder(0);
        $app->setThumbnail($serverbase . "/medias/apps/note.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $app->setFilesTypes(Array("main" => Array("php", "c", "cpp", "py", "html", "yml", "json", "txt", "md", "js", "xml", "php"), "other" => Array()));
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "calls"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("calls");
        $app->setName("Calls");
        $app->setDescription("Twake video-conferencing app.");
        $app->setShortDescription("Twake video-conferencing app.");
        $app->setUrl("calls");
        $app->setUserRights(json_decode('{"general":{"create":true, "view":true, "edit":true}}', true));
        $app->setApplicationRights(json_decode('{"messages":"write"}', true));
        $app->setEnabled(1);
        $app->setColor("00ba4f");
        $app->setCanCreateFile(0);
        $app->setIsCapable(0);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode("", true));
        $app->setMessageModule(1);
        $app->setOrder(0);
        $app->setThumbnail($serverbase . "/medias/apps/calls.png");
        $app->setMessageModuleUrl("/calls.html?message=true");
        $app->setEditableRights(1);
        $app->setCgu("");
        $app->setFilesTypes(Array());
        $manager->persist($app);

        $manager->flush();


        $apps = [
            ["/medias/apps/web/vectr.png", "Vectr", "vectr.com", "vectr", "101010", Array()],
            ["/medias/apps/web/webflow.jpeg", "Webflow", "webflow.com", "webflow", "354145", Array()],
            ["/medias/apps/web/witeboard.png", "Witeboard", "witeboard.com", "witeboard", "222222", Array()],
            ["/medias/apps/web/flat_io.png", "Flat.io", "flat.io/score", "flat_io", "3990f8", Array()],
            ["/medias/apps/web/play_canvas.png", "Play Canvas", "playcanvas.com/editor", "playcanvas", "d64e0e", Array()],
            ["/medias/apps/web/tuzzit_board.png", "Tuzzit", "board.tuzzit.com", "board.tuzzit", "4ab5a3", Array()],
            ["/medias/apps/web/hackmd.png", "HackMd", "hackmd.io", "hackmd", "333333", Array()],
            ["/medias/apps/web/trello.png", "Trello", "trello.com", "trello", "0079bf", Array()],
            ["/medias/apps/web/gitlab.png", "Gitlab", "gitlab.com", "gitlab", "fc9626", Array()],
            ["/medias/apps/web/github.png", "Github", "github.com", "github", "24292e", Array()],
            ["/medias/apps/web/overleaf.png", "Overleaf", "overleaf.com", "overleaf", "61994F", Array()],
            ["/medias/apps/web/sharelatex.png", "Sharelatex", "sharelatex.com", "sharelatex", "9F2E25", Array()],

            //Altassian
            ["/medias/apps/web/atlassian.png", "Atlassian", "atlassian.net", "atlassian", "0047B3", Array()],

            //gSuite
            ["/medias/apps/web/google_hangouts.png", "Google Hangouts", "hangouts.google.com", "hangouts.google", "50AF55", Array()],
            ["/medias/apps/web/google_sites.png", "Google Sites", "sites.google.com", "sites.google", "E63B42", Array()],
            ["/medias/apps/web/google_docs_document.png", "Google Docs Document", "docs.google.com/document", "document.docs.google", "367FDF", Array()],
            ["/medias/apps/web/google_docs_spreadsheets.png", "Google Docs Spreadsheets", "docs.google.com/spreadsheets", "spreadsheets.docs.google", "50AF55", Array()],
            ["/medias/apps/web/google_docs_presentation.png", "Google Docs Presentation", "docs.google.com/presentation", "presentation.docs.google", "F9D548", Array()],
            ["/medias/apps/web/google_drawings.png", "Google Drawings", "docs.google.com/drawings", "drawings.docs.google", "F2B014", Array()],
            ["/medias/apps/web/google_docs_forms.png", "Google Docs Forms", "docs.google.com/forms", "forms.docs.google", "7457C7", Array()],
            ["/medias/apps/web/google_gmail.png", "Gmail", "mail.google.com", "mail.google", "ED5938", Array()],

            //apple
            ["/medias/apps/web/icloud_keynote.png", "iCloud Keynote", "icloud.com/keynote", "keynote.icloud", "1d73f2", Array()],
            ["/medias/apps/web/icloud_numbers.png", "iCloud Numbers", "icloud.com/numbers", "numbers.icloud", "15d71f", Array()],
            ["/medias/apps/web/icloud_pages.png", "iCloud Pages", "icloud.com/pages", "pages.icloud", "ff8800", Array()],
            ["/medias/apps/web/icloud_notes.png", "iCloud Notes", "icloud.com/#notes", "notes.icloud", "ffce08", Array()],
            ["/medias/apps/web/icloud_reminders.png", "iCloud Reminders", "icloud.com/#reminders", "reminders.icloud", "383836", Array()],
            ["/medias/apps/web/icloud_contacts.png", "iCloud Contacts", "icloud.com/#contacts", "contacts.icloud", "BBBBBB", Array()],
            ["/medias/apps/web/icloud_photos.png", "iCloud Photos", "icloud.com/#photos", "photos.icloud", "E47563", Array()],

            //Microsoft
            ["/medias/apps/web/office_365_skype.png", "Skype", "web.skype.com", "skype", "00aff0", Array()],
            ["/medias/apps/web/office_365_calendar.png", "Outlook Calendar", "outlook.live.com/calendar", "calendar.office_365", "0072c7", Array()],
            ["/medias/apps/web/office_365_outlook.png", "Outlook ", "outlook.live.com/mail", "outlook.office_365", "0072c6", Array()],
            ["/medias/apps/web/office_365_contacts.png", "Outlook Contacts", "outlook.live.com/people", "contacts.office_365", "0072c7", Array()],
            ["/medias/apps/web/office_365_sway.png", "Sway", "sway.com", "sway.office_365", "16897c", Array()],
            ["/medias/apps/web/office_365_onenote.png", "OneNote", "onedrive.live.com/onenote", "onenote.office_365", "793474", Array()],
            ["/medias/apps/web/office_365_powerpoint.png", "PowerPoint", "onedrive.live.com/powerpoint", "powerpoint.office_365", "d34725", Array()],
            ["/medias/apps/web/office_365_word.png", "Word", "onedrive.live.com/word", "word.office_365", "2a5699", Array()],
            ["/medias/apps/web/office_365_excel.png", "Excel", "onedrive.live.com/excel", "excel.office_365", "1E683D", Array()],


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
            $app->setIsCapable(1);
            $app->setDefault(0);
            $app->setCreateFileData(json_decode("", true));
            $app->setMessageModule(0);
            $app->setOrder(2);
            $app->setThumbnail($serverbase .$application[0] );
            $app->setMessageModuleUrl("");
            $app->setEditableRights(0);
            $app->setCgu("");
            $app->setUrlApp(1);
            $manager->persist($app);
        }

        $manager->flush();

        /*
         * Init pour la future mise a jour
         */


    }

}