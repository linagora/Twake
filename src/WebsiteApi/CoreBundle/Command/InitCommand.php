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
  var $APPS_SERVER;
var $newApps = Array('all'=>Array(), 'notall'=>Array());

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
      '--force'  => true,
    );

    $greetInput = new ArrayInput($arguments);
    $returnCode = $command->run($greetInput, $output);

    if ($returnCode != 0 && !$ignore){
      $output->writeln('ERROR (FATAL) : doctrine schema update failed, add option --ignore to execute this command without controlling the error codes');
      return 1;
    } else if ($returnCode!= 0 && !$ignore) {
      $output->writeln('WARNING : doctrine schema update failed, error was ignored');
    }

    $doctrine = $this->getContainer()->get('doctrine');
    $manager = $doctrine->getManager();


    /**
     * Récupération des repository, de Twake et des applis de base
     */

    $services = $this->getApplication()->getKernel()->getContainer();

    $services->get('app.pricing_plan')->init();

    /**
     * Initialisation des groups apps et worskspace apps
     */
      $groupAppRepository = $doctrine->getRepository("TwakeWorkspacesBundle:Group");

      $groups = $groupAppRepository->findBy(Array());
      foreach ( $groups as $g ){
          $services->get("app.groups")->init($g);
      }
      error_log("Init group app");

      $workspaceAppRepository = $doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

      $workspaces = $workspaceAppRepository->findBy(Array());
      foreach ( $workspaces as $w ){
          $services->get("app.workspaces")->init($w);
      }
      error_log("Init workspaces app");

  }
}