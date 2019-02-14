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
use WebsiteApi\UsersBundle\Entity\User;
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

        //Do it 2 time to be sure
        for ($i = 0; $i < 2; $i++) {
            $command = $this->getApplication()->find('twake:schema:update');

            $arguments = array(
                'command' => 'twake:schema:update',
                '--force' => true
            );
            $greetInput = new ArrayInput($arguments);
            $returnCode = $command->run($greetInput, $output);

            if ($returnCode != 0 && !$ignore) {
                $output->writeln('ERROR (FATAL) : doctrine schema update failed, add option --ignore to execute this command without controlling the error codes');
                return 1;
            } else if ($returnCode != 0 && !$ignore) {
                $output->writeln('WARNING : doctrine schema update failed, error was ignored');
            }
        }

        $manager = $this->getContainer()->get('app.twake_doctrine');


        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApplication()->getKernel()->getContainer();
        $serverbase = $this->getContainer()->getParameter('SERVER_NAME');

        // Création d'un pricing minimum gratuit
        $plan = $services->get("app.pricing_plan")->getMinimalPricing();
        if (!$plan) {
            $plan = new PricingPlan("standard");
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

        //Création de l'user twake_bot
        $twake_bot = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "twake_bot"));
        if($twake_bot==null){
            $twake_bot = new User();
        }
        $twake_bot->setIsNew(false);
        $twake_bot->setIsRobot(true);
        $twake_bot->setPassword(bin2hex(random_bytes(20)));
        $twake_bot->setUsername("twake_bot");
        $twake_bot->setFirstName("Twake");
        $twake_bot->setLastName("Bot");
        $twake_bot->setEmail("twake_bot@twakeapp.com");
        $manager->persist($twake_bot);

        // Création des applications de base
        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "messages"));
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

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "drive"));
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

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "calendar"));
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

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "tasks"));
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

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "imageviewer"));
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
        $app->setOrder(2);
        $app->setThumbnail($serverbase . "/medias/apps/images_viewer.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(0);
        $app->setCgu("");
        $app->setFilesTypes(Array("main" => Array("png","jpg","jpeg","gif","bmp","tiff"), "other" => Array()));
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "pdfviewer"));
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
        $app->setOrder(2);
        $app->setThumbnail($serverbase . "/medias/apps/pdf_viewer.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(0);
        $app->setCgu("");
        $app->setFilesTypes(Array("main" => Array("pdf"), "other" => Array()));
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "note"));
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
        $app->setOrder(2);
        $app->setThumbnail($serverbase . "/medias/apps/note.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $app->setFilesTypes(Array("main" => Array("php", "c", "cpp", "py", "html", "yml", "json", "txt", "md", "js", "xml", "php"), "other" => Array()));
        $manager->persist($app);

        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => "calls"));
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
        $app->setOrder(2);
        $app->setThumbnail($serverbase . "/medias/apps/calls.png");
        $app->setMessageModuleUrl("/calls.html?message=true");
        $app->setEditableRights(0);
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
            ["/medias/apps/web/overleaf.png", "Overleaf", "overleaf.com", "overleaf", "61994F", Array()],
            ["/medias/apps/web/sharelatex.png", "Sharelatex", "sharelatex.com", "sharelatex", "9F2E25", Array()],

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

            ["/medias/apps/web/absence-io.png", "Absence.io", "absenceio", "absenceio", "23e494", Array()],
            ["/medias/apps/web/adaptiveinsights.png", "Adaptive Insights", "adaptiveinsights", "adaptiveinsights", "E65400", Array()],
            ["/medias/apps/web/and-co.png", "And Co", "andco", "andco", "fc343b", Array()],
            ["/medias/apps/web/approval-donkey.png", "Approval Donkey", "approvaldonkey", "approvaldonkey", "2c74b4", Array()],
            ["/medias/apps/web/chargebee.png", "Chargebee", "chargebee", "chargebee", "FF6C36", Array()],
            ["/medias/apps/web/coinbase.png", "Coinbase", "coinbase", "coinbase", "045cb8", Array()],
            ["/medias/apps/web/concur.png", "Concur", "concur", "concur", "006CA7", Array()],
            ["/medias/apps/web/debitoor.png", "Debitoor", "debitoor", "debitoor", "23B3FF", Array()],
            ["/medias/apps/web/dubsado.png", "Dubsado", "dubsado", "dubsado", "29b1b6", Array()],
            ["/medias/apps/web/expensify.png", "Expensify", "expensify", "expensify", "2BD275", Array()],
            ["/medias/apps/web/finamatic.png", "Finamatic", "finamatic", "finamatic", "507ABD", Array()],
            ["/medias/apps/web/fizen.png", "Fizen", "fizen", "fizen", "AABC00", Array()],
            ["/medias/apps/web/freeagent.png", "FreeAgent", "freeagent", "freeagent", "047cbc", Array()],
            ["/medias/apps/web/freshbooks.png", "Freshbooks", "freshbooks", "freshbooks", "86C61F", Array()],
            ["/medias/apps/web/gocardless.png", "Gocardless", "gocardless", "gocardless", "0854B3", Array()],
            ["/medias/apps/web/invoicely.png", "Invoicely", "invoicely", "invoicely", "FF5813", Array()],
            ["/medias/apps/web/ipaidthat.png", "iPaidThat", "ipaidthat", "ipaidthat", "f45344", Array()],
            ["/medias/apps/web/lendix.png", "Lendix", "lendix", "lendix", "363D4D", Array()],
            ["/medias/apps/web/n-26.png", "N26", "", "n26", "00D3D8", Array()],
            ["/medias/apps/web/netsuite.png", "Netsuite", "netsuite", "netsuite", "214A6C", Array()],
            ["/medias/apps/web/payfacile.png", "Payfacile", "payfacile", "payfacile", "00B1AF", Array()],
            ["/medias/apps/web/paypal.png", "Paypal", "paypal", "paypal", "149cd4", Array()],
            ["/medias/apps/web/procurify.png", "Procurify", "procurify", "procurify", "04bc5c", Array()],
            ["/medias/apps/web/profitwell.png", "ProfitWell", "profitwell", "profitwell", "00BB9F", Array()],
            ["/medias/apps/web/qonto.png", "Qonto", "qonto", "qonto", "5040B2", Array()],
            ["/medias/apps/web/quickbooks.png", "Quickbooks", "quickbooks", "quickbooks", "24A106", Array()],
            ["/medias/apps/web/raindrop.png", "Raindrop", "raindrop", "raindrop", "516AEB", Array()],
            ["/medias/apps/web/spendesk.png", "Spendesk", "spendesk", "spendesk", "6c2cf4", Array()],
            ["/medias/apps/web/stripe.png", "Stripe", "stripe", "stripe", "359AD5", Array()],
            ["/medias/apps/web/tiime.png", "Tiime", "tiime", "tiime", "00A5D1", Array()],
            ["/medias/apps/web/trackmysubs.png", "TrackMySubs", "trackmysubs", "trackmysubs", "1cbcdb", Array()],
            ["/medias/apps/web/wave.png", "Wave", "wave", "wave", "00BFFF", Array()],
            ["/medias/apps/web/wepay.png", "WePay", "wepay", "wepay", "2CA92D", Array()],
            ["/medias/apps/web/x3-builders.png", "X3", "", "x3", "000000", Array()],
            ["/medias/apps/web/xero.png", "Xero", "xero", "xero", "13B5EA", Array()],
            ["/medias/apps/web/ynab.png", "YNAB", "ynab", "ynab", "74c4e4", Array()],
            ["/medias/apps/web/1password.png", "1Password", "", "1password", "2175FF", Array()],
            ["/medias/apps/web/booking-admin.png", "Booking Admin", "bookingadmin", "bookingadmin", "049ce3", Array()],
            ["/medias/apps/web/expedia-partner-central.png", "Expedia Partner Central", "expediapartnercentral", "expediapartnercentral", "fccc34", Array()],
            ["/medias/apps/web/fareharbor.png", "FareHarbor", "fareharbor", "fareharbor", "0c6ccc", Array()],
            ["/medias/apps/web/forest.png", "Forest", "forest", "forest", "FEFEFE", Array()],
            ["/medias/apps/web/google-webmaster.png", "Google Webmaster", "googlewebmaster", "googlewebmaster", "4089F8", Array()],
            ["/medias/apps/web/izettle.png", "iZettle", "izettle", "izettle", "34446e", Array()],
            ["/medias/apps/web/lightspeed-ecommerce.png", "Lightspeed eCommerce", "lightspeedecommerce", "lightspeedecommerce", "e43839", Array()],
            ["/medias/apps/web/lightspeed-onsite.png", "Lightspeed OnSite", "lightspeedonsite", "lightspeedonsite", "e43839", Array()],
            ["/medias/apps/web/lightspeed-restaurant.png", "Lightspeed Restaurant", "lightspeedrestaurant", "lightspeedrestaurant", "e43839", Array()],
            ["/medias/apps/web/lightspeed-retail.png", "Lightspeed Retail", "lightspeedretail", "lightspeedretail", "e43839", Array()],
            ["/medias/apps/web/mews.png", "Mews", "mews", "mews", "000000", Array()],
            ["/medias/apps/web/nuage.png", "Nuage App", "nuageapp", "nuageapp", "33AFFF", Array()],
            ["/medias/apps/web/okta.png", "Okta", "okta", "okta", "007EC7", Array()],
            ["/medias/apps/web/shopify.png", "Shopify Admin", "shopifyadmin", "shopifyadmin", "95BF46", Array()],
            ["/medias/apps/web/square.png", "Square", "square", "square", "", Array()],
            ["/medias/apps/web/stationadmin.png", "Station Admin", "stationadmin", "stationadmin", "2440FF", Array()],
            ["/medias/apps/web/travelclick.png", "TravelClick", "travelclick", "travelclick", "489ad4", Array()],
            ["/medias/apps/web/zenypass.png", "ZenyPass", "zenypass", "zenypass", "21A0B7", Array()],
            ["/medias/apps/web/contentstudio.png", "ContentStudio", "contentstudio", "contentstudio", "0494f4", Array()],
            ["/medias/apps/web/getsitecontrol.png", "GetSiteControl", "getsitecontrol", "getsitecontrol", "363D4D", Array()],
            ["/medias/apps/web/medium.png", "Medium", "medium", "medium", "000000", Array()],
            ["/medias/apps/web/picthrive.png", "PicThrive", "picthrive", "picthrive", "04aa54", Array()],
            ["/medias/apps/web/planable.png", "Planable", "planable", "planable", "24cc7c", Array()],
            ["/medias/apps/web/poeditor.png", "Poeditor", "poeditor", "poeditor", "3DD0AD", Array()],
            ["/medias/apps/web/prismic.png", "Prismic", "prismic", "prismic", "1DE9B6", Array()],
            ["/medias/apps/web/squarespace.png", "Squarespace", "squarespace", "squarespace", "1A1918", Array()],
            ["/medias/apps/web/tumblr.png", "Tumblr", "tumblr", "tumblr", "2F4357", Array()],
            ["/medias/apps/web/wordpress.png", "Wordpress", "wordpress", "wordpress", "0087BE", Array()],
            ["/medias/apps/web/smartsheet.png", "SmartSheet", "smartsheet", "smartsheet", "295277", Array()],
            ["/medias/apps/web/acuity-scheduling.png", "Acuity Scheduling", "acuityscheduling", "acuityscheduling", "63B1AE", Array()],
            ["/medias/apps/web/aircall-phone.png", "Aircall", "aircall", "aircall", "52CC52", Array()],
            ["/medias/apps/web/android-messages.png", "Android Messages", "androidmessages", "androidmessages", "546cfc", Array()],
            ["/medias/apps/web/appear-in.png", "Appear.in", "appearin", "appearin", "FF2960", Array()],
            ["/medias/apps/web/better-up.png", "BetterUp", "betterup", "betterup", "fc6c4c", Array()],
            ["/medias/apps/web/calendly.png", "Calendly", "calendly", "calendly", "00BFFF", Array()],
            ["/medias/apps/web/camscanner.png", "Camscanner", "camscanner", "camscanner", "FEFEFE", Array()],
            ["/medias/apps/web/chatwork.png", "Chatwork", "chatwork", "chatwork", "fb443c", Array()],
            ["/medias/apps/web/cloud-app.png", "Cloud App", "cloudapp", "cloudapp", "", Array()],
            ["/medias/apps/web/dailyco.png", "Daily.co", "dailyco", "dailyco", "517fad", Array()],
            ["/medias/apps/web/dialpad.png", "Dialpad", "dialpad", "dialpad", "26387c", Array()],
            ["/medias/apps/web/diffeo.png", "Diffeo", "diffeo", "diffeo", "", Array()],
            ["/medias/apps/web/discord.png", "Discord", "discord", "discord", "7289DA", Array()],
            ["/medias/apps/web/doodle.png", "Doodle", "doodle.com", "doodle", "349cd4", Array()],
            ["/medias/apps/web/draw-io.png", "Draw.io", "drawio", "drawio", "f48c04", Array()],
            ["/medias/apps/web/dropbox-paper.png", "Dropbox Paper", "dropboxpaper", "dropboxpaper", "007EE5", Array()],
            ["/medias/apps/web/evernote.png", "Evernote", "evernote", "evernote", "7AC143", Array()],
            ["/medias/apps/web/messenger.png", "Facebook Messenger", "facebookmessenger", "facebookmessenger", "", Array()],
            ["/medias/apps/web/fb-workplace.png", "Facebook Workplace", "facebookworkplace", "facebookworkplace", "373F4D", Array()],
            ["/medias/apps/web/fleep.png", "Fleep", "fleep", "fleep", "3c8cdc", Array()],
            ["/medias/apps/web/flock.png", "Flock", "flock", "flock", "0ABE51", Array()],
            ["/medias/apps/web/flowdock.png", "Flowdock", "flowdock", "flowdock", "F99E29", Array()],
            ["/medias/apps/web/freshcaller.png", "Freshcaller", "freshcaller", "freshcaller", "CC4783", Array()],
            ["/medias/apps/web/freshchat.png", "Freshchat", "freshchat", "freshchat", "45A4EC", Array()],
            ["/medias/apps/web/fullcontact.png", "FullContact", "fullcontact", "fullcontact", "c41c24", Array()],
            ["/medias/apps/web/gitter.png", "Gitter", "gitter", "gitter", "ea2769", Array()],
            ["/medias/apps/web/gliffy.png", "Gliffy", "gliffy", "gliffy", "225594", Array()],
            ["/medias/apps/web/glip.png", "Glip", "glip", "glip", "FF8800", Array()],
            ["/medias/apps/web/google-allo.png", "Google Allo", "googleallo", "googleallo", "fbbb0b", Array()],
            ["/medias/apps/web/gcalendar.png", "Google Calendar", "googlecalendar", "googlecalendar", "3A82F5", Array()],
            ["/medias/apps/web/google-chat.png", "Google Chat", "googlechat", "googlechat", "057473", Array()],
            ["/medias/apps/web/google-classroom.png", "Google Classroom", "googleclassroom", "googleclassroom", "1ca464", Array()],
            ["/medias/apps/web/google-inbox.png", "Google Inbox", "googleinbox", "googleinbox", "205081", Array()],
            ["/medias/apps/web/google-keep.png", "Google Keep", "googlekeep", "googlekeep", "F6B500", Array()],
            ["/medias/apps/web/google-translate.png", "Google Translate", "googletranslate", "googletranslate", "4c8cf4", Array()],
            ["/medias/apps/web/google-voice.png", "Google Voice", "googlevoice", "googlevoice", "448cfc", Array()],
            ["/medias/apps/web/groupme.png", "Groupme", "groupme", "groupme", "04acec", Array()],
            ["/medias/apps/web/hipchat.png", "HipChat", "hipchat", "hipchat", "2582FD", Array()],
            ["/medias/apps/web/jive.png", "Jive Software", "jivesoftware", "jivesoftware", "142345", Array()],
            ["/medias/apps/web/kin-today.png", "Kin.today", "kintoday", "kintoday", "FEFEFE", Array()],
            ["/medias/apps/web/livestorm.png", "Livestorm", "livestorm", "livestorm", "2492D6", Array()],
            ["/medias/apps/web/lucidcharts.png", "Lucid Chart", "lucidchart", "lucidchart", "F78D1E", Array()],
            ["/medias/apps/web/ludus.png", "Ludus", "ludus", "ludus", "4E56FF", Array()],
            ["/medias/apps/web/meet.png", "Meet", "meet", "meet", "009585", Array()],
            ["/medias/apps/web/notejoy.png", "Notejoy", "notejoy", "notejoy", "cc343c", Array()],
            ["/medias/apps/web/notion.png", "Notion", "notion", "notion", "FEFEFE", Array()],
            ["/medias/apps/web/nuclino.png", "Nuclino", "nuclino", "nuclino", "fc5464", Array()],
            ["/medias/apps/web/polymail.png", "Polymail", "polymail", "polymail", "fc3d5b", Array()],
            ["/medias/apps/web/protonmail.png", "Proton Mail", "protonmail", "protonmail", "1E213F", Array()],
            ["/medias/apps/web/quandora.png", "Quandora", "quandora", "quandora", "DD5234", Array()],
            ["/medias/apps/web/realtimeboard.png", "Realtime Board", "realtimeboard", "realtimeboard", "FFCE01", Array()],
            ["/medias/apps/web/goboomtown-relay.png", "Relay by Goboomtown", "relaybygoboomtown", "relaybygoboomtown", "4a74b4", Array()],
            ["/medias/apps/web/rocket-chat.png", "Rocket.Chat", "rocketchat", "rocketchat", "c4242c", Array()],
            ["/medias/apps/web/ryver.png", "Ryver", "ryver", "ryver", "04c4fc", Array()],
            ["/medias/apps/web/simple-note.png", "Simple Note", "simplenote", "simplenote", "448AC9", Array()],
            ["/medias/apps/web/slack.png", "Slack", "slack", "slack", "42C299", Array()],
            ["/medias/apps/web/slite.png", "Slite", "slite", "slite", "FFE697", Array()],
            ["/medias/apps/web/solid.png", "Solid", "solid", "solid", "3A434C", Array()],
            ["/medias/apps/web/spectrum.png", "Spectrum", "spectrum", "spectrum", "6c2cf4", Array()],
            ["/medias/apps/web/stride.png", "Stride", "stride", "stride", "2179fe", Array()],
            ["/medias/apps/web/teamleader.png", "Teamleader", "teamleader", "teamleader", "20B1A9", Array()],
            ["/medias/apps/web/telegram.png", "Telegram", "telegram", "telegram", "FEFEFE", Array()],
            ["/medias/apps/web/tribe.png", "Tribe", "tribe", "tribe", "3CE8DA", Array()],
            ["/medias/apps/web/twilio.png", "Twilio", "twilio", "twilio", "CF272D", Array()],
            ["/medias/apps/web/twist.png", "Twist", "twist", "twist", "346cec", Array()],
            ["/medias/apps/web/vkontakte.png", "VKontakte", "vkontakte", "vkontakte", "648cbc", Array()],
            ["/medias/apps/web/voxer.png", "Voxer", "voxer", "voxer", "f46424", Array()],
            ["/medias/apps/web/vyte.png", "Vyte", "vyte", "vyte", "008FF8", Array()],
            ["/medias/apps/web/wechat.png", "WeChat", "wechat", "wechat", "2DC100", Array()],
            ["/medias/apps/web/whatsapp.png", "Whatsapp", "whatsapp", "whatsapp", "25D366", Array()],
            ["/medias/apps/web/wire.png", "Wire", "wire", "wire", "", Array()],
            ["/medias/apps/web/workflowy.png", "Workflowy", "workflowy", "workflowy", "2494CA", Array()],
            ["/medias/apps/web/yahoo-email.png", "Yahoo Email", "yahooemail", "yahooemail", "4c0c94", Array()],
            ["/medias/apps/web/yammer.png", "Yammer", "yammer", "yammer", "245494", Array()],
            ["/medias/apps/web/yandex-mail.png", "Yandex Mail", "yandexmail", "yandexmail", "dc0404", Array()],
            ["/medias/apps/web/zalo.png", "Zalo", "zalo", "zalo", "0484c4", Array()],
            ["/medias/apps/web/zoom-us.png", "Zoom us", "zoomus", "zoomus", "2D8CFF", Array()],
            ["/medias/apps/web/amazon.png", "Amazon", "amazon", "amazon", "fc9c04", Array()],
            ["/medias/apps/web/itunes-connect.png", "App Store Connect", "appstoreconnect", "appstoreconnect", "1895FB", Array()],
            ["/medias/apps/web/coursera.png", "Coursera", "coursera", "coursera", "448cc4", Array()],
            ["/medias/apps/web/dropmark.png", "Dropmark", "dropmark", "dropmark", "3cdcdc", Array()],
            ["/medias/apps/web/feedly.png", "Feedly", "feedly", "feedly", "6CC655", Array()],
            ["/medias/apps/web/google-play-store.png", "Google Play Store", "googleplaystore", "googleplaystore", "43BFC3", Array()],
            ["/medias/apps/web/inoreader.png", "Inoreader", "inoreader", "inoreader", "2c6ccc", Array()],
            ["/medias/apps/web/instapaper.png", "Instapaper", "instapaper", "instapaper", "", Array()],
            ["/medias/apps/web/mightytext.png", "MightyText", "mightytext", "mightytext", "3c94ac", Array()],
            ["/medias/apps/web/newsify.png", "Newsify", "newsify", "newsify", "1c8cec", Array()],
            ["/medias/apps/web/pocket.png", "Pocket", "pocket", "pocket", "EF4056", Array()],
            ["/medias/apps/web/producthunt.png", "ProductHunt", "producthunt", "producthunt", "DA552F", Array()],
            ["/medias/apps/web/quora.png", "Quora", "quora", "quora", "bc2c24", Array()],
            ["/medias/apps/web/reddit.png", "Reddit", "reddit", "reddit", "fc3c1c", Array()],
            ["/medias/apps/web/refind.png", "Refind", "refind", "refind", "0090F2", Array()],
            ["/medias/apps/web/teamblind.png", "TeamBlind", "teamblind", "teamblind", "e41c24", Array()],
            ["/medias/apps/web/trustpilot.png", "TrustPilot", "trustpilot", "trustpilot", "FFA902", Array()],
            ["/medias/apps/web/abstract.png", "Abstract", "abstract", "abstract", "000000", Array()],
            ["/medias/apps/web/airstory.png", "Airstory", "airstory", "airstory", "426cb4", Array()],
            ["/medias/apps/web/artmoi.png", "Artmoi", "artmoi", "artmoi", "24ccd4", Array()],
            ["/medias/apps/web/balsamiq.png", "Balsamiq", "balsamiq", "balsamiq", "", Array()],
            ["/medias/apps/web/behance.png", "Behance", "behance", "behance", "000000", Array()],
            ["/medias/apps/web/canva.png", "Canva", "canva", "canva", "18B9C1", Array()],
            ["/medias/apps/web/dribbble.png", "Dribbble", "dribbble", "dribbble", "EA4988", Array()],
            ["/medias/apps/web/figma.png", "Figma", "figma", "figma", "000000", Array()],
            ["/medias/apps/web/flipboard.png", "Flipboard", "flipboard", "flipboard", "f42424", Array()],
            ["/medias/apps/web/invision.png", "Invision", "invision", "invision", "DC395F", Array()],
            ["/medias/apps/web/landscape.png", "Landscape", "landscape", "landscape", "374242", Array()],
            ["/medias/apps/web/lingo.png", "Lingo App", "lingoapp", "lingoapp", "FF605D", Array()],
            ["/medias/apps/web/marvelapp.png", "Marvel", "marvel", "marvel", "1FB6FF", Array()],
            ["/medias/apps/web/milanote.png", "Milanote", "milanote", "milanote", "f4541c", Array()],
            ["/medias/apps/web/moqups.png", "Moqups", "moqups", "moqups", "FEFEFE", Array()],
            ["/medias/apps/web/quire.png", "Quire", "quire", "quire", "94c453", Array()],
            ["/medias/apps/web/sketchcloud.png", "Sketch Cloud", "sketchcloud", "sketchcloud", "fcaa04", Array()],
            ["/medias/apps/web/stencil.png", "Stencil", "stencil", "stencil", "449cd4", Array()],
            ["/medias/apps/web/the-noun-project.png", "The Noun Project", "thenounproject", "thenounproject", "000000", Array()],
            ["/medias/apps/web/unsplash.png", "Unsplash", "unsplash", "unsplash", "", Array()],
            ["/medias/apps/web/uxpin.png", "UXpin", "uxpin", "uxpin", "2C97DE", Array()],
            ["/medias/apps/web/wix.png", "Wix", "wix", "wix", "fcac4a", Array()],
            ["/medias/apps/web/zeplin.png", "Zeplin", "zeplin", "zeplin", "F89920", Array()],
            ["/medias/apps/web/algolia.png", "Algolia", "algolia", "algolia", "42AFDA", Array()],
            ["/medias/apps/web/aws-account.png", "Amazon AWS", "amazonaws", "amazonaws", "F68D11", Array()],
            ["/medias/apps/web/aws.png", "AWS Root Console", "awsrootconsole", "awsrootconsole", "F68D11", Array()],
            ["/medias/apps/web/bitbucket.png", "Bitbucket", "bitbucket", "bitbucket", "FEFEFE", Array()],
            ["/medias/apps/web/browser-stack.png", "BrowserStack", "browserstack", "browserstack", "231F20", Array()],
            ["/medias/apps/web/bubble.png", "Bubble", "bubble", "bubble", "52ADE0", Array()],
            ["/medias/apps/web/bugsnag.png", "Bugsnag", "bugsnag", "bugsnag", "3676A1", Array()],
            ["/medias/apps/web/circleci.png", "Circleci", "circleci", "circleci", "000000", Array()],
            ["/medias/apps/web/cloudflare.png", "Cloudflare", "cloudflare", "cloudflare", "F38020", Array()],
            ["/medias/apps/web/codecov.png", "Codecov", "codecov", "codecov", "E03997", Array()],
            ["/medias/apps/web/codepen.png", "Codepen", "codepen", "codepen", "000000", Array()],
            ["/medias/apps/web/codeship.png", "Codeship", "codeship", "codeship", "2b333c", Array()],
            ["/medias/apps/web/datadog.png", "Datadog", "datadog", "datadog", "774B9E", Array()],
            ["/medias/apps/web/devdocs.png", "Devdocs", "devdocs", "devdocs", "000000", Array()],
            ["/medias/apps/web/digitalocean.png", "DigitalOcean", "digitalocean", "digitalocean", "1484fc", Array()],
            ["/medias/apps/web/fabric-io.png", "Fabric.io", "fabricio", "fabricio", "008BF3", Array()],
            ["/medias/apps/web/firebase.png", "Firebase", "firebase", "firebase", "FCC338", Array()],
            ["/medias/apps/web/ghostinspector.png", "Ghostinspector", "ghostinspector", "ghostinspector", "FEFEFE", Array()],
            ["/medias/apps/web/github.png", "GitHub", "github", "github", "221E1B", Array()],
            ["/medias/apps/web/gitlab.png", "Gitlab", "gitlab", "gitlab", "E24329", Array()],
            ["/medias/apps/web/graphcool.png", "GraphCool", "graphcool", "graphcool", "00B257", Array()],
            ["/medias/apps/web/hackerone.png", "HackerOne", "hackerone", "hackerone", "090908", Array()],
            ["/medias/apps/web/heroku.png", "Heroku", "heroku", "heroku", "430098", Array()],
            ["/medias/apps/web/kaggle.png", "Kaggle", "kaggle", "kaggle", "20BEFF", Array()],
            ["/medias/apps/web/launchdarkly.png", "LaunchDarkly", "launchdarkly", "launchdarkly", "8295b6", Array()],
            ["/medias/apps/web/litmus.png", "Litmus", "litmus", "litmus", "51B371", Array()],
            ["/medias/apps/web/mailgun.png", "Mailgun", "mailgun", "mailgun", "c4141c", Array()],
            ["/medias/apps/web/managewp.png", "ManageWP", "managewp", "managewp", "249cbc", Array()],
            ["/medias/apps/web/manychat.png", "Manychat", "manychat", "manychat", "2464ec", Array()],
            ["/medias/apps/web/netlify.png", "Netlify", "netlify", "netlify", "24B5BB", Array()],
            ["/medias/apps/web/onesignal.png", "OneSignal", "onesignal", "onesignal", "FFFFFE", Array()],
            ["/medias/apps/web/papertrail.png", "Papertrail", "papertrail", "papertrail", "FB9E00", Array()],
            ["/medias/apps/web/phabricator.png", "Phabricator", "phabricator", "phabricator", "384663", Array()],
            ["/medias/apps/web/pingdom.png", "Pingdom", "pingdom", "pingdom", "F8EC4A", Array()],
            ["/medias/apps/web/rollbar.png", "Rollbar", "rollbar", "rollbar", "3B4352", Array()],
            ["/medias/apps/web/runscope.png", "Runscope", "runscope", "runscope", "3E64A0", Array()],
            ["/medias/apps/web/sendwithus.png", "SendWithUs", "sendwithus", "sendwithus", "f4941c", Array()],
            ["/medias/apps/web/sentry.png", "Sentry", "sentry", "sentry", "E54628", Array()],
            ["/medias/apps/web/stackoverflow.png", "StackOverflow", "stackoverflow", "stackoverflow", "f48424", Array()],
            ["/medias/apps/web/statusio.png", "Status.io", "statusio", "statusio", "EF5555", Array()],
            ["/medias/apps/web/statuspage.png", "StatusPage", "statuspage", "statuspage", "82BC00", Array()],
            ["/medias/apps/web/travis.png", "Travis CI", "travisci", "travisci", "39AA56", Array()],
            ["/medias/apps/web/webtask.png", "Webtask", "webtask", "webtask", "E56E62", Array()],
            ["/medias/apps/web/zenhub.png", "Zenhub", "zenhub", "zenhub", "3F4D9C", Array()],
            ["/medias/apps/web/newton-software.png", "Newton Software", "newtonsoftware", "newtonsoftware", "f64266", Array()],
            ["/medias/apps/web/15five.png", "15Five", "", "15five", "fc6c34", Array()],
            ["/medias/apps/web/7geese.png", "7geese", "", "7geese", "384663", Array()],
            ["/medias/apps/web/alan.png", "Alan", "alan", "alan", "00CC7E", Array()],
            ["/medias/apps/web/angel-list.png", "AngelList", "angellist", "angellist", "000000", Array()],
            ["/medias/apps/web/bamboo.png", "Bamboo HR", "bamboohr", "bamboohr", "8AC831", Array()],
            ["/medias/apps/web/cakehr.png", "CakeHR", "cakehr", "cakehr", "E60062", Array()],
            ["/medias/apps/web/concord.png", "Concord", "concord", "concord", "E60062", Array()],
            ["/medias/apps/web/creme-de-la-creme.png", "Creme de la creme", "cremedelacreme", "cremedelacreme", "272E3A", Array()],
            ["/medias/apps/web/digidom.png", "Digidom", "digidom", "digidom", "FF893B", Array()],
            ["/medias/apps/web/docusign.png", "Docusign", "docusign", "docusign", "314EA0", Array()],
            ["/medias/apps/web/freshteam.png", "Freshteam", "freshteam", "freshteam", "FF5969", Array()],
            ["/medias/apps/web/greenhouse.png", "Greenhouse", "greenhouse", "greenhouse", "3cb4a4", Array()],
            ["/medias/apps/web/gusto.png", "Gusto", "gusto", "gusto", "FF0137", Array()],
            ["/medias/apps/web/hellosign.png", "Hellosign", "hellosign", "hellosign", "00B1E5", Array()],
            ["/medias/apps/web/hired.png", "Hired", "hired", "hired", "E82F3A", Array()],
            ["/medias/apps/web/hopwork.png", "Hopwork", "hopwork", "hopwork", "FEFEFE", Array()],
            ["/medias/apps/web/humanity.png", "Humanity", "humanity", "humanity", "44a4cc", Array()],
            ["/medias/apps/web/javelo.png", "Javelo", "javelo", "javelo", "FFB137", Array()],
            ["/medias/apps/web/lever.png", "Lever", "lever", "lever", "a6a5a6", Array()],
            ["/medias/apps/web/lucca.png", "Lucca", "lucca", "lucca", "F27020", Array()],
            ["/medias/apps/web/nereo.png", "Nereo", "nereo", "nereo", "00A1E5", Array()],
            ["/medias/apps/web/onboard-iq.png", "Onboard IQ", "onboardiq", "onboardiq", "000000", Array()],
            ["/medias/apps/web/paychex.png", "Paychex", "paychex", "paychex", "4484BF", Array()],
            ["/medias/apps/web/payfit.png", "Payfit", "payfit", "payfit", "2B71B1", Array()],
            ["/medias/apps/web/peakon.png", "Peakon", "peakon", "peakon", "38BE7F", Array()],
            ["/medias/apps/web/seekube.png", "Seekube", "seekube", "seekube", "3ca4d4", Array()],
            ["/medias/apps/web/seeqle.png", "Seeqle", "seeqle", "seeqle", "23ace0", Array()],
            ["/medias/apps/web/side.png", "Side", "side", "side", "3484ec", Array()],
            ["/medias/apps/web/sleekr.png", "Sleekr", "sleekr", "sleekr", "04a464", Array()],
            ["/medias/apps/web/smartwaiver.png", "Smartwaiver", "smartwaiver", "smartwaiver", "74b424", Array()],
            ["/medias/apps/web/staffme.png", "StaffMe", "staffme", "staffme", "ec4c3c", Array()],
            ["/medias/apps/web/staffomatic.png", "Staffomatic", "staffomatic", "staffomatic", "000000", Array()],
            ["/medias/apps/web/talent-io.png", "Talent.io", "talentio", "talentio", "6AA5CB", Array()],
            ["/medias/apps/web/toggl.png", "Toggl", "toggl", "toggl", "E41317", Array()],
            ["/medias/apps/web/upwork.png", "Upwork", "upwork", "upwork", "6FDA44", Array()],
            ["/medias/apps/web/welcomekit.png", "Welcomekit", "welcomekit", "welcomekit", "30CB8C", Array()],
            ["/medias/apps/web/workable.png", "Workable", "workable", "workable", "33B6CB", Array()],
            ["/medias/apps/web/workday.png", "Workday", "workday", "workday", "EA9A30", Array()],
            ["/medias/apps/web/yousign.png", "Yousign", "yousign", "yousign", "0AA8D3", Array()],
            ["/medias/apps/web/zenefits.png", "Zenefits", "zenefits", "zenefits", "FAAE42", Array()],
            ["/medias/apps/web/zenploy.png", "Zenploy", "zenploy", "zenploy", "3E82F7", Array()],
            ["/medias/apps/web/abtasty.png", "AB Tasty", "abtasty", "abtasty", "529DF5", Array()],
            ["/medias/apps/web/active-campaign.png", "Active Campaign", "activecampaign", "activecampaign", "255EAF", Array()],
            ["/medias/apps/web/adobe-analytics.png", "Adobe Analytics", "adobeanalytics", "adobeanalytics", "79BB43", Array()],
            ["/medias/apps/web/ahrefs.png", "Ahrefs", "ahrefs", "ahrefs", "045c9c", Array()],
            ["/medias/apps/web/amplitude.png", "Amplitude", "amplitude", "amplitude", "00A7CF", Array()],
            ["/medias/apps/web/attribution.png", "Attribution", "attribution", "attribution", "13C685", Array()],
            ["/medias/apps/web/auto-pilot.png", "Auto pilot", "autopilot", "autopilot", "292A28", Array()],
            ["/medias/apps/web/avora.png", "Avora", "avora", "avora", "fc1444", Array()],
            ["/medias/apps/web/baremetrics.png", "Baremetrics", "baremetrics", "baremetrics", "0077B8", Array()],
            ["/medias/apps/web/bime.png", "Bime Analytics", "bimeanalytics", "bimeanalytics", "2E3240", Array()],
            ["/medias/apps/web/bitly.png", "Bit.ly", "bitly", "bitly", "EE4F1E", Array()],
            ["/medias/apps/web/campaign-monitor.png", "Campaign Monitor", "campaignmonitor", "campaignmonitor", "509CF6", Array()],
            ["/medias/apps/web/chartbeat.png", "Chartbeat", "chartbeat", "chartbeat", "657D8D", Array()],
            ["/medias/apps/web/chartio.png", "Chartio", "chartio", "chartio", "333D47", Array()],
            ["/medias/apps/web/chartmogul.png", "Chartmogul", "chartmogul", "chartmogul", "FEFEFE", Array()],
            ["/medias/apps/web/cluvio.png", "Cluvio", "cluvio", "cluvio", "FFFFFE", Array()],
            ["/medias/apps/web/communicatorcorp.png", "Communicatorcorp", "communicatorcorp", "communicatorcorp", "26BAD9", Array()],
            ["/medias/apps/web/constantcontact.png", "Constant Contact", "constantcontact", "constantcontact", "164889", Array()],
            ["/medias/apps/web/convertfox.png", "ConvertFox", "convertfox", "convertfox", "FC6C04", Array()],
            ["/medias/apps/web/convertkit.png", "Convertkit", "convertkit", "convertkit", "3494d4", Array()],
            ["/medias/apps/web/coschedule.png", "CoSchedule", "coschedule", "coschedule", "d4745c", Array()],
            ["/medias/apps/web/crowdfire.png", "Crowdfire", "crowdfire", "crowdfire", "E8484C", Array()],
            ["/medias/apps/web/customerio.png", "Customer.io", "customerio", "customerio", "00ACAB", Array()],
            ["/medias/apps/web/cyfe.png", "Cyfe", "cyfe", "cyfe", "3cacf4", Array()],
            ["/medias/apps/web/databox.png", "Databox", "databox", "databox", "E50D18", Array()],
            ["/medias/apps/web/databricks.png", "Databricks", "databricks", "databricks", "f4542c", Array()],
            ["/medias/apps/web/domo.png", "Domo", "domo", "domo", "99CCEE", Array()],
            ["/medias/apps/web/drip.png", "Drip", "drip", "drip", "4477BD", Array()],
            ["/medias/apps/web/eventbrite.png", "Eventbrite", "eventbrite", "eventbrite", "fc8f26", Array()],
            ["/medias/apps/web/fastmail.png", "Fastmail", "fastmail", "fastmail", "F3BB32", Array()],
            ["/medias/apps/web/fullstory.png", "FullStory", "fullstory", "fullstory", "448FE1", Array()],
            ["/medias/apps/web/getemail.png", "Getemail", "getemail", "getemail", "179D82", Array()],
            ["/medias/apps/web/gleam.png", "Gleam", "gleam", "gleam", "f46c24", Array()],
            ["/medias/apps/web/google-analytics.png", "Google Analytics", "analytics.google.com", "googleanalytics", "ffa71a", Array()],
            ["/medias/apps/web/google-data-studio.png", "Google Data Studio", "googledatastudio", "googledatastudio", "1B68D1", Array()],
            ["/medias/apps/web/google-optimize.png", "Google Optimize", "googleoptimize", "googleoptimize", "DB4437", Array()],
            ["/medias/apps/web/google-tag-manager.png", "Google Tag Manager", "googletagmanager", "googletagmanager", "5072AA", Array()],
            ["/medias/apps/web/growbots.png", "Growbots", "growbots", "growbots", "2D6EF0", Array()],
            ["/medias/apps/web/heap.png", "Heap Analytics", "heapanalytics", "heapanalytics", "F0594E", Array()],
            ["/medias/apps/web/hotjar.png", "Hotjar", "hotjar", "hotjar", "DF2338", Array()],
            ["/medias/apps/web/instant-magazine.png", "Instant Magazine", "instantmagazine", "instantmagazine", "", Array()],
            ["/medias/apps/web/instapage.png", "Instapage", "instapage", "instapage", "2092C9", Array()],
            ["/medias/apps/web/kissmetrics.png", "Kissmetrics", "kissmetrics", "kissmetrics", "4651FF", Array()],
            ["/medias/apps/web/klipfolio.png", "Klipfolio", "klipfolio", "klipfolio", "ec3424", Array()],
            ["/medias/apps/web/logmatic.png", "Logmatic", "logmatic", "logmatic", "289BD7", Array()],
            ["/medias/apps/web/looker.png", "Looker", "looker", "looker", "7c5ce4", Array()],
            ["/medias/apps/web/mailchimp.png", "Mailchimp", "mailchimp", "mailchimp", "239AB9", Array()],
            ["/medias/apps/web/mailerlite.png", "Mailerlite", "mailerlite", "mailerlite", "00A250", Array()],
            ["/medias/apps/web/mailjet.png", "Mailjet", "mailjet", "mailjet", "FFBF2D", Array()],
            ["/medias/apps/web/mailshake.png", "Mailshake", "mailshake", "mailshake", "3F4D9C", Array()],
            ["/medias/apps/web/mandrill.png", "Mandrill", "mandrill", "mandrill", "C02439", Array()],
            ["/medias/apps/web/marketo.png", "Marketo", "marketo", "marketo", "8D70C9", Array()],
            ["/medias/apps/web/missive.png", "Missive", "missive", "missive", "000000", Array()],
            ["/medias/apps/web/mixpanel.png", "Mixpanel", "mixpanel", "mixpanel", "094B74", Array()],
            ["/medias/apps/web/mode-analytics.png", "Mode Analytics", "modeanalytics", "modeanalytics", "34ac64", Array()],
            ["/medias/apps/web/mrrio.png", "MRR.io", "mrrio", "mrrio", "00B4CC", Array()],
            ["/medias/apps/web/newrelic.png", "New Relic", "newrelic", "newrelic", "72CCD2", Array()],
            ["/medias/apps/web/optimizely.png", "Optimizely", "optimizely", "optimizely", "1A64B2", Array()],
            ["/medias/apps/web/pardot.png", "Pardot", "pardot", "pardot", "7F868B", Array()],
            ["/medias/apps/web/periscopedata.png", "Periscope Data", "periscopedata", "periscopedata", "9F3BF2", Array()],
            ["/medias/apps/web/planoly.png", "Planoly", "planoly", "planoly", "", Array()],
            ["/medias/apps/web/postmark.png", "Postmark", "postmark", "postmark", "FFE200", Array()],
            ["/medias/apps/web/powerbi.png", "PowerBI", "powerbi", "powerbi", "FEFEFE", Array()],
            ["/medias/apps/web/segment.png", "Segment", "segment", "segment", "43AD7A", Array()],
            ["/medias/apps/web/sendgrid.png", "Sendgrid", "sendgrid", "sendgrid", "239FD7", Array()],
            ["/medias/apps/web/smartkeyword.png", "Smartkeyword", "smartkeyword", "smartkeyword", "67C68F", Array()],
            ["/medias/apps/web/sparkpost.png", "Sparkpost", "sparkpost", "sparkpost", "FA6423", Array()],
            ["/medias/apps/web/sumo.png", "Sumo", "sumo", "sumo", "066FE8", Array()],
            ["/medias/apps/web/tableau.png", "Tableau", "tableau", "tableau", "24447c", Array()],
            ["/medias/apps/web/userengage.png", "User Engage", "userengage", "userengage", "008BE7", Array()],
            ["/medias/apps/web/vimeo.png", "Vimeo", "vimeo", "vimeo", "04acec", Array()],
            ["/medias/apps/web/viralloops.png", "Viral Loops", "viralloops", "viralloops", "2F2BAD", Array()],
            ["/medias/apps/web/visible.png", "Visible", "visible", "visible", "17AAD4", Array()],
            ["/medias/apps/web/vwo.png", "VWO", "vwo", "vwo", "F5873F", Array()],
            ["/medias/apps/web/wisestamp.png", "WiseStamp", "wisestamp", "wisestamp", "1eb6eb", Array()],
            ["/medias/apps/web/wishpond.png", "Wishpond", "wishpond", "wishpond", "01A3E2", Array()],
            ["/medias/apps/web/agile-crm.png", "Agile CRM", "agilecrm", "agilecrm", "449ce4", Array()],
            ["/medias/apps/web/anylead.png", "Anyleads", "anyleads", "anyleads", "FEFEFE", Array()],
            ["/medias/apps/web/better-proposals.png", "Better Proposals", "betterproposals", "betterproposals", "5ED9AA", Array()],
            ["/medias/apps/web/bitrix24.png", "Bitrix24", "", "bitrix24", "2ec4f4", Array()],
            ["/medias/apps/web/boomerang.png", "Boomerang", "boomerang", "boomerang", "4a4a4a", Array()],
            ["/medias/apps/web/capsulecrm.png", "CapsuleCRM", "capsulecrm", "capsulecrm", "e3247c", Array()],
            ["/medias/apps/web/clearbit.png", "Clearbit Connect", "clearbitconnect", "clearbitconnect", "499AFF", Array()],
            ["/medias/apps/web/closeio.png", "Close.io", "closeio", "closeio", "3FB87A", Array()],
            ["/medias/apps/web/find-that-lead.png", "Find That Lead", "findthatlead", "findthatlead", "35A8E1", Array()],
            ["/medias/apps/web/flexie.png", "Flexie", "flexie", "flexie", "00648A", Array()],
            ["/medias/apps/web/near.png", "Folk", "folk", "folk", "446271", Array()],
            ["/medias/apps/web/freshdesk.png", "Freshdesk", "freshdesk", "freshdesk", "25C16F", Array()],
            ["/medias/apps/web/freshsales.png", "Freshsales", "freshsales", "freshsales", "FFA800", Array()],
            ["/medias/apps/web/gmelius.png", "Gmelius", "gmelius", "gmelius", "E63A36", Array()],
            ["/medias/apps/web/google-contact.png", "Google Contact", "googlecontact", "googlecontact", "3054BC", Array()],
            ["/medias/apps/web/gosquared.png", "GoSquared", "gosquared", "gosquared", "0056DC", Array()],
            ["/medias/apps/web/groove.png", "Groove", "groove", "groove", "03A3BB", Array()],
            ["/medias/apps/web/hootsuite.png", "Hootsuite", "hootsuite", "hootsuite", "FFBC12", Array()],
            ["/medias/apps/web/hubspot.png", "Hubspot", "hubspot", "hubspot", "FEFEFE", Array()],
            ["/medias/apps/web/hunter.png", "Hunter", "hunter", "hunter", "F1F1F1", Array()],
            ["/medias/apps/web/infusionsoft.png", "Infusionsoft", "infusionsoft", "infusionsoft", "4c5cc4", Array()],
            ["/medias/apps/web/intercom.png", "Intercom", "intercom", "intercom", "1F8DED", Array()],
            ["/medias/apps/web/leadberry.png", "Leadberry", "leadberry", "leadberry", "E22F1B", Array()],
            ["/medias/apps/web/linkedIn.png", "Linkedin Sales Navigator", "linkedinsalesnavigator", "linkedinsalesnavigator", "0071A1", Array()],
            ["/medias/apps/web/mailtracker.png", "MailTracker", "mailtracker", "mailtracker", "2D6EF0", Array()],
            ["/medias/apps/web/mixmax.png", "Mixmax", "mixmax", "mixmax", "24235C", Array()],
            ["/medias/apps/web/onepagecrm.png", "OnePageCRM", "onepagecrm", "onepagecrm", "FF9300", Array()],
            ["/medias/apps/web/paddle.png", "Paddle", "paddle", "paddle", "2a2a2a", Array()],
            ["/medias/apps/web/pipedrive.png", "Pipedrive", "pipedrive", "pipedrive", "231F1F", Array()],
            ["/medias/apps/web/prospectio.png", "Prospect.io", "prospectio", "prospectio", "906ECA", Array()],
            ["/medias/apps/web/prosperworks.png", "Prosperworks", "prosperworks", "prosperworks", "4A4A4A", Array()],
            ["/medias/apps/web/salesmachine.png", "Sales Machine", "salesmachine", "salesmachine", "4485D1", Array()],
            ["/medias/apps/web/sales-flare.png", "Salesflare", "salesflare", "salesflare", "5BB2DF", Array()],
            ["/medias/apps/web/salesforce.png", "Salesforce", "salesforce", "salesforce", "00A1E0", Array()],
            ["/medias/apps/web/salesforceiq.png", "SalesforceIQ", "salesforceiq", "salesforceiq", "2EB7C5", Array()],
            ["/medias/apps/web/satismeter.png", "Satismeter", "satismeter", "satismeter", "FF4981", Array()],
            ["/medias/apps/web/sellsy.png", "Sellsy", "sellsy", "sellsy", "26C6D0", Array()],
            ["/medias/apps/web/xactly.png", "Xactly", "xactly", "xactly", "F99100", Array()],
            ["/medias/apps/web/socialreport.png", "SocialReport", "socialreport", "socialreport", "e47404", Array()],
            ["/medias/apps/web/agora.png", "Agora Pulse", "agorapulse", "agorapulse", "E74810", Array()],
            ["/medias/apps/web/appnexus.png", "AppNexus", "appnexus", "appnexus", "FF8700", Array()],
            ["/medias/apps/web/awario.png", "Awario", "awario", "awario", "0cb4fc", Array()],
            ["/medias/apps/web/bufferapp.png", "Buffer", "buffer", "buffer", "000000", Array()],
            ["/medias/apps/web/buzzstream.png", "Buzzstream", "buzzstream", "buzzstream", "00A1E5", Array()],
            ["/medias/apps/web/chatfuel.png", "Chatfuel", "chatfuel", "chatfuel", "FEFEFE", Array()],
            ["/medias/apps/web/facebook-bm.png", "Facebook Business Manager", "facebookbusinessmanager", "facebookbusinessmanager", "3C5A9A", Array()],
            ["/medias/apps/web/google-adsense.png", "Google Adsense", "googleadsense", "googleadsense", "FFFFFE", Array()],
            ["/medias/apps/web/google-adwords.png", "Google Adwords", "googleadwords", "googleadwords", "4B79BF", Array()],
            ["/medias/apps/web/google-double-click-bid-manager.png", "Google Double Click Bid Manager", "googledoubleclickbidmanager", "googledoubleclickbidmanager", "0056DC", Array()],
            ["/medias/apps/web/instragram.png", "Instagram", "instagram", "instagram", "FAC373", Array()],
            ["/medias/apps/web/later.png", "Later", "later", "later", "20B1A9", Array()],
            ["/medias/apps/web/linkedIn.png", "LinkedIn", "linkedin", "linkedin", "0071A1", Array()],
            ["/medias/apps/web/meetup.png", "Meetup", "meetup", "meetup", "ec1c44", Array()],
            ["/medias/apps/web/mention.png", "Mention", "mention", "mention", "00A0DE", Array()],
            ["/medias/apps/web/opteo.png", "Opteo", "opteo", "opteo", "1056EA", Array()],
            ["/medias/apps/web/pablo.png", "Pablo", "pablo", "pablo", "393C3E", Array()],
            ["/medias/apps/web/pinterest.png", "Pinterest", "pinterest", "pinterest", "BD081C", Array()],
            ["/medias/apps/web/promo-republic.png", "Promo Republic", "promorepublic", "promorepublic", "AB2123", Array()],
            ["/medias/apps/web/semrush.png", "SEMrush", "semrush", "semrush", "bc4c2c", Array()],
            ["/medias/apps/web/shuuka.png", "Shuuka", "shuuka", "shuuka", "", Array()],
            ["/medias/apps/web/sprout-social.png", "Sprout Social", "sproutsocial", "sproutsocial", "0cac4c", Array()],
            ["/medias/apps/web/tweetdeck.png", "Tweetdeck", "tweetdeck", "tweetdeck", "00ABF1", Array()],
            ["/medias/apps/web/twitter.png", "Twitter", "twitter", "twitter", "1DA1F2", Array()],
            ["/medias/apps/web/twitter.png", "Twitter Ads", "twitterads", "twitterads", "1DA1F2", Array()],
            ["/medias/apps/web/box.png", "Box", "box", "box", "0464d4", Array()],
            ["/medias/apps/web/docsend.png", "DocSend", "docsend", "docsend", "04a4ec", Array()],
            ["/medias/apps/web/dropbox.png", "Dropbox", "dropbox", "dropbox", "007EE5", Array()],
            ["/medias/apps/web/google-cloud.png", "Google Cloud", "googlecloud", "googlecloud", "CC4232", Array()],
            ["/medias/apps/web/gdrive.png", "Google Drive", "googledrive", "googledrive", "FCCD48", Array()],
            ["/medias/apps/web/googlephotos.png", "Google Photos", "googlephotos", "googlephotos", "8DC44D", Array()],
            ["/medias/apps/web/mega.png", "Mega", "mega", "mega", "dc0404", Array()],
            ["/medias/apps/web/onedrive.png", "OneDrive", "onedrive", "onedrive", "094AB1", Array()],
            ["/medias/apps/web/pandadoc.png", "Pandadoc", "pandadoc", "pandadoc", "FEFEFE", Array()],
            ["/medias/apps/web/pcloud.png", "pCloud", "pcloud", "pcloud", "1cc4cc", Array()],
            ["/medias/apps/web/synology.png", "Synology", "synology", "synology", "FEFEFE", Array()],
            ["/medias/apps/web/wetransfer.png", "Wetransfer", "wetransfer", "wetransfer", "0092D0", Array()],
            ["/medias/apps/web/wistia.png", "Wistia", "wistia", "wistia", "53B9FF", Array()],
            ["/medias/apps/web/10000ft.png", "10000ft", "", "10000ft", "4771b0", Array()],
            ["/medias/apps/web/activecollab.png", "ActiveCollab", "activecollab", "activecollab", "449cf4", Array()],
            ["/medias/apps/web/aha.png", "Aha!", "aha", "aha", "0474cc", Array()],
            ["/medias/apps/web/airtable.png", "Airtable", "airtable", "airtable", "F02B42", Array()],
            ["/medias/apps/web/amazing-marvin.png", "Amazing Marvin", "amazingmarvin", "amazingmarvin", "5cbcbc", Array()],
            ["/medias/apps/web/any-do.png", "Any.do", "anydo", "anydo", "04a4f4", Array()],
            ["/medias/apps/web/asana.png", "Asana", "asana", "asana", "F95B82", Array()],
            ["/medias/apps/web/atlassian.png", "Atlassian (Jira, Confluence..)", "atlassianjiraconfluence", "atlassianjiraconfluence", "264970", Array()],
            ["/medias/apps/web/azendoo.png", "Azendoo", "azendoo", "azendoo", "42AFE3", Array()],
            ["/medias/apps/web/backlog.png", "Backlog", "backlog", "backlog", "4ccca4", Array()],
            ["/medias/apps/web/basecamp.png", "Basecamp", "basecamp", "basecamp", "66CC66", Array()],
            ["/medias/apps/web/clickup.png", "ClickUp", "clickup", "clickup", "7B68EE", Array()],
            ["/medias/apps/web/clubhouse.png", "Clubhouse", "clubhouse", "clubhouse", "CE2000", Array()],
            ["/medias/apps/web/complice.png", "Complice", "complice", "complice", "F8F8F9", Array()],
            ["/medias/apps/web/dapulse.png", "Dapulse", "dapulse", "dapulse", "FFFFFE", Array()],
            ["/medias/apps/web/dynalist.png", "Dynalist", "dynalist", "dynalist", "0484f7", Array()],
            ["/medias/apps/web/everhour.png", "Everhour", "everhour", "everhour", "", Array()],
            ["/medias/apps/web/favro.png", "Favro", "favro", "favro", "542cac", Array()],
            ["/medias/apps/web/flow.png", "Flow", "flow", "flow", "2C9EEE", Array()],
            ["/medias/apps/web/forecast.png", "Forecast", "forecast", "forecast", "FF7400", Array()],
            ["/medias/apps/web/frame-io.png", "Frame.io", "frameio", "frameio", "2c24bc", Array()],
            ["/medias/apps/web/freedcamp.png", "freedcamp", "freedcamp", "freedcamp", "000000", Array()],
            ["/medias/apps/web/habitica.png", "Habitica", "habitica", "habitica", "FEFEFE", Array()],
            ["/medias/apps/web/harvest.png", "Harvest", "harvest", "harvest", "FF7400", Array()],
            ["/medias/apps/web/instagantt.png", "Instagantt", "instagantt", "instagantt", "0c84f4", Array()],
            ["/medias/apps/web/kanban-tool.png", "Kanban Tool", "kanbantool", "kanbantool", "1A6FCD", Array()],
            ["/medias/apps/web/meistertask.png", "Meistertask", "meistertask", "meistertask", "07BCF8", Array()],
            ["/medias/apps/web/microsoft-dynamics.png", "Microsoft Dynamics", "microsoftdynamics", "microsoftdynamics", "000D93", Array()],
            ["/medias/apps/web/microsoft-todo.png", "Microsoft ToDo", "microsofttodo", "microsofttodo", "4B7CF2", Array()],
            ["/medias/apps/web/mind-meister.png", "Mind Meister", "mindmeister", "mindmeister", "F2488F", Array()],
            ["/medias/apps/web/monday.png", "Monday", "monday", "monday", "009FFF", Array()],
            ["/medias/apps/web/moodo.png", "Moo.do", "moodo", "moodo", "2582FD", Array()],
            ["/medias/apps/web/nozbe.png", "Nozbe", "nozbe", "nozbe", "2ce474", Array()],
            ["/medias/apps/web/ora.png", "Ora", "ora", "ora", "cc445c", Array()],
            ["/medias/apps/web/paymo.png", "Paymo", "paymo", "paymo", "4cac2c", Array()],
            ["/medias/apps/web/pipefy.png", "Pipefy", "pipefy", "pipefy", "129FFF", Array()],
            ["/medias/apps/web/pivotal-tracker.png", "Pivotal Tracker", "pivotaltracker", "pivotaltracker", "ED7D1A", Array()],
            ["/medias/apps/web/plan.png", "Plan", "plan", "plan", "", Array()],
            ["/medias/apps/web/plutio.png", "Plutio", "plutio", "plutio", "4E42C3", Array()],
            ["/medias/apps/web/podio.png", "Podio", "podio", "podio", "5088AC", Array()],
            ["/medias/apps/web/prodpad.png", "ProdPad", "prodpad", "prodpad", "53D33B", Array()],
            ["/medias/apps/web/productboard.png", "ProductBoard", "productboard", "productboard", "FEFEFE", Array()],
            ["/medias/apps/web/productive.png", "Productive", "productive", "productive", "349454", Array()],
            ["/medias/apps/web/quip.png", "Quip", "quip", "quip", "25B4E9", Array()],
            ["/medias/apps/web/redbooth.png", "Redbooth", "redbooth", "redbooth", "ec3c4c", Array()],
            ["/medias/apps/web/remember-the-milk.png", "Remember the Milk", "rememberthemilk", "rememberthemilk", "045cbb", Array()],
            ["/medias/apps/web/roadmap.png", "Roadmap", "roadmap", "roadmap", "0050F4", Array()],
            ["/medias/apps/web/shipstation.png", "ShipStation", "shipstation", "shipstation", "9FC848", Array()],
            ["/medias/apps/web/startme.png", "Start.me", "startme", "startme", "006BB6", Array()],
            ["/medias/apps/web/sunsama.png", "Sunsama", "sunsama", "sunsama", "", Array()],
            ["/medias/apps/web/teamgantt.png", "teamgantt", "teamgantt", "teamgantt", "64bcd4", Array()],
            ["/medias/apps/web/teamweek.png", "Teamweek", "teamweek", "teamweek", "01C100", Array()],
            ["/medias/apps/web/teamwork.png", "Teamwork", "teamwork", "teamwork", "65D656", Array()],
            ["/medias/apps/web/the-hq.png", "The HQ", "thehq", "thehq", "ff4155", Array()],
            ["/medias/apps/web/ticktick.png", "TickTick", "ticktick", "ticktick", "65D656", Array()],
            ["/medias/apps/web/timely.png", "Timely", "timely", "timely", "324554", Array()],
            ["/medias/apps/web/todoist.png", "Todoist", "todoist", "todoist", "E64229", Array()],
            ["/medias/apps/web/toodledo.png", "Toodledo", "toodledo", "toodledo", "ec9c2b", Array()],
            ["/medias/apps/web/trello.png", "Trello", "trello.com", "trello", "0085D3", Array()],
            ["/medias/apps/web/wedo.png", "Wedo", "wedo", "wedo", "00BFFF", Array()],
            ["/medias/apps/web/wrike.png", "Wrike", "wrike", "wrike", "00A651", Array()],
            ["/medias/apps/web/wunderlist.png", "Wunderlist", "wunderlist", "wunderlist", "E94027", Array()],
            ["/medias/apps/web/youtrack.png", "YouTrack", "youtrack", "youtrack", "", Array()],
            ["/medias/apps/web/zenkit.png", "Zenkit", "zenkit", "zenkit", "E371A9", Array()],
            ["/medias/apps/web/zoho.png", "Zoho", "zoho", "zoho", "F0483E", Array()],
            ["/medias/apps/web/amity.png", "Amity", "amity", "amity", "8BC542", Array()],
            ["/medias/apps/web/appcues.png", "Appcues", "appcues", "appcues", "35AAE6", Array()],
            ["/medias/apps/web/aptly.png", "Aptly", "aptly", "aptly", "04acec", Array()],
            ["/medias/apps/web/crisp.png", "Crisp.im", "crispim", "crispim", "4661EE", Array()],
            ["/medias/apps/web/desk.png", "Desk", "desk", "desk", "239EDA", Array()],
            ["/medias/apps/web/dovetail.png", "Dovetail", "dovetail", "dovetail", "5434a4", Array()],
            ["/medias/apps/web/drift.png", "Drift", "drift", "drift", "333333", Array()],
            ["/medias/apps/web/elevio.png", "Elevio", "elevio", "elevio", "00769F", Array()],
            ["/medias/apps/web/freshservice.png", "Fresh Service", "freshservice", "freshservice", "0cc4fc", Array()],
            ["/medias/apps/web/front.png", "Front", "front", "front", "F35B5F", Array()],
            ["/medias/apps/web/gainsight.png", "Gainsight", "gainsight", "gainsight", "00B5E6", Array()],
            ["/medias/apps/web/gorgias.png", "gorgias", "gorgias", "gorgias", "072184", Array()],
            ["/medias/apps/web/helpscout.png", "HelpScout", "helpscout", "helpscout", "2896D5", Array()],
            ["/medias/apps/web/kayako.png", "Kayako", "kayako", "kayako", "40364D", Array()],
            ["/medias/apps/web/natero.png", "Natero", "natero", "natero", "E8484C", Array()],
            ["/medias/apps/web/receptive.png", "Receptive", "receptive", "receptive", "33495F", Array()],
            ["/medias/apps/web/snapengage.png", "Snapengage", "snapengage", "snapengage", "38AEFF", Array()],
            ["/medias/apps/web/stationcommunity.png", "Station Community", "stationcommunity", "stationcommunity", "303030", Array()],
            ["/medias/apps/web/support-hero.png", "Support Hero", "supporthero", "supporthero", "000000", Array()],
            ["/medias/apps/web/survey-gizmo.png", "Survey Gizmo", "surveygizmo", "surveygizmo", "FEFEFE", Array()],
            ["/medias/apps/web/surveymonkey.png", "Survey Monkey", "surveymonkey", "surveymonkey", "B2BB1D", Array()],
            ["/medias/apps/web/talkus.png", "Talkus", "talkus", "talkus", "ED5D4A", Array()],
            ["/medias/apps/web/tawkto.png", "Tawk.to", "tawkto", "tawkto", "28ae4c", Array()],
            ["/medias/apps/web/teamsupport.png", "Team Support", "teamsupport", "teamsupport", "fcc205", Array()],
            ["/medias/apps/web/totango.png", "Totango", "totango", "totango", "65D45B", Array()],
            ["/medias/apps/web/trustyou.png", "TrustYou", "trustyou", "trustyou", "0494dc", Array()],
            ["/medias/apps/web/typeform.png", "Typeform", "typeform", "typeform", "89C6BE", Array()],
            ["/medias/apps/web/uservoice.png", "Uservoice", "uservoice", "uservoice", "D74119", Array()],
            ["/medias/apps/web/wootric.png", "Wootric", "wootric", "wootric", "80CC3A", Array()],
            ["/medias/apps/web/zendesk.png", "Zendesk", "zendesk", "zendesk", "00363E", Array()],
            ["/medias/apps/web/zendesk-chat.png", "Zendesk Chat", "zendeskchat", "zendeskchat", "F99B30", Array()],
            ["/medias/apps/web/azureportal.png", "Azure Portal", "azureportal", "azureportal", "008CDB", Array()],
            ["/medias/apps/web/blockspring.png", "Blockspring", "blockspring", "blockspring", "00BD58", Array()],
            ["/medias/apps/web/brainfm.png", "Brain.fm", "brainfm", "brainfm", "5c04e4", Array()],
            ["/medias/apps/web/deepl.png", "Deepl", "deepl", "deepl", "0e9bf0", Array()],
            ["/medias/apps/web/duolingo.png", "Duolingo", "duolingo", "duolingo", "7ccb04", Array()],
            ["/medias/apps/web/googlemaps.png", "Google Maps", "googlemaps", "googlemaps", "DC4B3E", Array()],
            ["/medias/apps/web/ifttt.png", "IFTTT", "ifttt", "ifttt", "049cfc", Array()],
            ["/medias/apps/web/lunchr.png", "Lunchr", "lunchr", "lunchr", "", Array()],
            ["/medias/apps/web/noisli.png", "Noisli", "noisli", "noisli", "87DDB2", Array()],
            ["/medias/apps/web/soundcloud.png", "SoundCloud", "soundcloud", "soundcloud", "f4640c", Array()],
            ["/medias/apps/web/twitch.png", "Twitch", "twitch", "twitch", "6444a4", Array()],
            ["/medias/apps/web/udemy.png", "Udemy", "udemy", "udemy", "ec5454", Array()],
            ["/medias/apps/web/what3words.png", "What3words Map", "", "what3wordsmap", "dc1c24", Array()],
            ["/medias/apps/web/zapier.png", "Zapier", "zapier", "zapier", "FF4A00", Array()],
            ["/medias/apps/web/zimbra.png", "Zimbra", "zimbra", "zimbra", "3784BC", Array()],


            ["/medias/apps/web/any_url.png", "External app", "any_url", "any_app", "888888", Array("order" => 1000000000)]

        ];

        foreach ($apps as $application){
            $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publickey" => $application[3]));
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
            $app->setOrder(isset($application[5]["order"]) ? $application[5]["order"] : 2);
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