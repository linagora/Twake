<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 16/02/18
 * Time: 17:38
 */

namespace Administration\AuthenticationBundle\Command;

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
use WebsiteApi\MarketBundle\Entity\Category;
use Symfony\Component\Console\Helper\ProgressBar;

class CronDailyCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:cronDaily")
            ->setDescription("StatsDaily")
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $services = $this->getApplication()->getKernel()->getContainer();

        //User
        $services->get('admin.TwakeDailyMessage')->countDailyMessageAll();

        //Workspace
        //$services->get('admin.TwakeDailyMessage')->saveRamUsage();
    }
}