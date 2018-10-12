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

    public function chooseFileSystemService()
    {
        $services = $this->getApplication()->getKernel()->getContainer();
        $aws = $this->getContainer()->getParameter('aws');
        if (isset($aws["S3"]["use"]) && $aws["S3"]["use"]) {
            return $services->get('app.drive.AWS_FileSystem');
        }
        return $services->get('app.drive.FileSystem');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        /* @var DriveFileSystem $driveFileSystem*/
        $driveFileSystem = $this->chooseFileSystemService();

        $driveFileSystem->autoGenPreview();
    }




}