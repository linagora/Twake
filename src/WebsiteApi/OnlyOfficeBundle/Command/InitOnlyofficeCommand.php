<?php

namespace WebsiteApi\OnlyOfficeBundle\Command;

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
 * User: Romaric Mourgues
 * Date: 20/06/2017
 * Time: 09:45
 */
class InitOnlyofficeCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    protected function configure()
    {
        $this
            ->setName("twake:init_onlyoffice")
            ->setDescription("Command to add onlyoffice to installation, make sure you have an onlyoffice server running");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $manager = $this->getContainer()->get('app.twake_doctrine');

        $serverbase = $this->getContainer()->getParameter('SERVER_NAME') . "/";

        // Création des applications
        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("simple_name" => "onlyoffice_presentation"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("onlyoffice_presentation");
        $app->setName("Presentation ONLYOFFICE");
        $app->setDescription("ONLYOFFICE Presentation");
        $app->setShortDescription("ONLYOFFICE Presentation");
        $app->setUrl($serverbase . "ajax/onlyoffice/slide");
        $app->setUserRights(Array());
        $app->setApplicationRights(json_decode('{"drive":"write"}', true));
        $app->setEnabled(1);
        $app->setColor("aa5252");
        $app->setCanCreateFile(1);
        $app->setIsCapable(0);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode('{"name": "Presentation", "url": "' . $serverbase . 'medias/apps/empty_files/empty.pptx", "extension": "pptx"}', true));
        $app->setFilesTypes(json_decode('{"main": ["pptx", "ppt", "odp"], "other": []}', true));
        $app->setMessageModule(0);
        $app->setOrder(1);
        $app->setThumbnail($serverbase . "/medias/apps/onlyoffice_presentation.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $manager->persist($app);


        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("simple_name" => "onlyoffice_document"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("onlyoffice_document");
        $app->setName("Document ONLYOFFICE");
        $app->setDescription("ONLYOFFICE Document");
        $app->setShortDescription("ONLYOFFICE Document");
        $app->setUrl($serverbase . "ajax/onlyoffice/text");
        $app->setUserRights(Array());
        $app->setApplicationRights(json_decode('{"drive":"write"}', true));
        $app->setEnabled(1);
        $app->setColor("446995");
        $app->setCanCreateFile(1);
        $app->setIsCapable(0);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode('{"name": "Document", "url": "' . $serverbase . 'medias/apps/empty_files/empty.docx", "extension": "docx"}', true));
        $app->setFilesTypes(json_decode('{"main": ["docx", "doc", "odt", "mht", "epub", "djvu", "xps"], "other": []}', true));
        $app->setMessageModule(0);
        $app->setOrder(1);
        $app->setThumbnail($serverbase . "/medias/apps/onlyoffice_text.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $manager->persist($app);


        $app = $manager->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("simple_name" => "onlyoffice_spreadsheet"));
        if (!$app) {
            $app = new Application();
        }
        $app->setPublicKey("onlyoffice_spreadsheet");
        $app->setName("Spreadsheet ONLYOFFICE");
        $app->setDescription("ONLYOFFICE Spreadsheet");
        $app->setShortDescription("ONLYOFFICE Spreadsheet");
        $app->setUrl($serverbase . "ajax/onlyoffice/spreadsheet");
        $app->setUserRights(Array());
        $app->setApplicationRights(json_decode('{"drive":"write"}', true));
        $app->setEnabled(1);
        $app->setColor("40865c");
        $app->setCanCreateFile(1);
        $app->setIsCapable(0);
        $app->setDefault(1);
        $app->setCreateFileData(json_decode('{"name": "Spreadsheet", "url": "' . $serverbase . 'medias/apps/empty_files/empty.xlsx", "extension": "xlsx"}', true));
        $app->setFilesTypes(json_decode('{"main": ["xlsx", "xls", "ods"], "other": ["csv"]}', true));
        $app->setMessageModule(0);
        $app->setOrder(1);
        $app->setThumbnail($serverbase . "/medias/apps/onlyoffice_spreadsheet.png");
        $app->setMessageModuleUrl("");
        $app->setEditableRights(1);
        $app->setCgu("");
        $manager->persist($app);

        $manager->flush();

    }

}