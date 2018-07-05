<?php

namespace WebsiteApi\DriveBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use \DateTime;
use WebsiteApi\DriveBundle\Services\DriveFileSystem;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;


class DrivePreviewCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    protected function configure()
    {
        $this
            ->setName("twake:preview_worker");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {
        /**
         * Récupération des repository, de Twake et des applis de base
         */

        $services = $this->getApplication()->getKernel()->getContainer();

        /* @var DriveFileSystem $driveFileSystem*/
        $driveFileSystem = $services->get("app.drive.FileSystem");

        $driveFileSystem->autoGenPreview();
    }




}