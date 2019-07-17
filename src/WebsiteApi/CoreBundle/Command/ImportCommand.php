<?php
namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\Level;

class ImportCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    var $newApps = Array('all' => Array(), 'notall' => Array());

    protected function configure()
    {
        $this
            ->setName("twake:import_group")
            ->setDescription("Command to import a group from old Twake")
            ->addArgument('tarname', InputArgument::REQUIRED, 'Which tar do you want to import');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $services = $this->getApplication()->getKernel()->getContainer();
        $doctrine = $this->getContainer()->get('doctrine');
        $manager = $doctrine->getManager();
        $group_name = $input->getArgument('name');
        //error_log(print_r($group_name,true));
        $export_user = true;

        mkdir("Import_tmp");
        $phar = new \PharData('Export.tar');
        $phar->extractTo('"Import_tmp',null, true);

        //chdir("Import_tmp");

    }
}
