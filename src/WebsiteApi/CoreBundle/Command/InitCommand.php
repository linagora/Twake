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
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\PaymentsBundle\Entity\PriceLevel;
use WebsiteApi\UploadBundle\Entity\File;
use WebsiteApi\MarketBundle\Entity\Category;
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
      )

      ->addOption(
        "recovery",
        "r",
        InputOption::VALUE_NONE,
        "Recreate the link between groups and basic application, using this should be very slow !"
      );
  }


  private function addFile($name, $type){
    $doctrine = $this->getContainer()->get('doctrine');
    $manager = $doctrine->getManager();
    $file = new File();
    $file->setName($name);
    $file->setType($type);
    $file->setRealName($name);
    $file->setSizes(4);
    $file->setWeight(100000);
    $manager->persist($file);
    $manager->flush();
    return $file;
  }


  protected function execute(InputInterface $input, OutputInterface $output)
  {
    $starttime = microtime(true);
    $this->APPS_SERVER = $this->getContainer()->getParameter('APPS_SERVER');

    $force = $input->getOption('recovery');
    $this->force = $force;
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

    $repoWorkspace = $manager->getRepository('TwakeWorkspacesBundle:Workspace');
    $repoLinkWorkspaceUser = $manager->getRepository('TwakeWorkspacesBundle:LinkWorkspaceUser');
    $repoLevel = $manager->getRepository('TwakeWorkspacesBundle:Level');
    $repoUser = $manager->getRepository('TwakeUsersBundle:User');
    $Twake = $repoWorkspace->findOneBy(Array('name'=>'Twake', 'official'=>true));
    $admin = $repoUser->findOneBy(Array('username_clean'=>'admin'));
    $addTwake = false;

    //Creation of admin user :
    if($admin != null){
      $created = false;
      // Reset du password
      $password = "CitiGo54";
      $userManager = $this->getApplication()->getKernel()->getContainer()->get('fos_user.user_manager');
      $factory = $this->getApplication()->getKernel()->getContainer()->get('security.encoder_factory');
      $encoder = $factory->getEncoder($admin);
      $admin->setPassword($encoder->encodePassword($password, $admin->getSalt()));
      $userManager->updateUser($admin);

      $em = $doctrine->getManager();
      $em->persist($admin);
      $em->flush();
    } else {
      $created = true;
      // Creation du compte admin
      $username = "Admin";
      $cleanUsername = "admin";
      $email = "admin@twakeapp.com";
      $password = "CitiGo54";
      $userManager = $this->getApplication()->getKernel()->getContainer()->get('fos_user.user_manager');

      $user = $userManager->createUser();

      $user->setEnabled(true);

      $user->setEmail($email);
      $user->setUsername($username);
      $user->setUsernameClean($cleanUsername);
      $user->setConfirmationToken(null);
      $factory = $this->getApplication()->getKernel()->getContainer()->get('security.encoder_factory');
      $encoder = $factory->getEncoder($user);
      $user->setPassword($encoder->encodePassword($password, $user->getSalt()));

      $userManager->updateUser($user);

      $em = $doctrine->getManager();
      $em->persist($user);
      $em->flush();
      $admin = $user;
    }
    $output->writeln("Admin user ".($created?"added":"verified")." , Id of this user is : ".$admin->getId());

    /**
     * Validation and creation of Twake group
     */

    if ($Twake != null){
    } else {
      // Official group Twake doesn't exist, we must create it
      $addTwake = true;
    }


    if ($addTwake){
      $newTwake = $this->createTwake($manager);
    } else {
      $newTwake = $Twake;
      $this->leveladmin = $repoLevel->findOneBy(Array("groupe"=>$newTwake, "owner"=>1));
    }
    $output->writeln("");
    $output->writeln("Twake group ".($addTwake?"added":"verified")." , Id of this group is : ".$newTwake->getId());
    $this->twake = $newTwake;
    /**
     *  Verification that Admin is an admin of twake group
     */

    $linkAdmin = $repoLinkWorkspaceUser->findOneBy(Array("Workspace"=>$newTwake, "User"=>$admin));
    if ($linkAdmin != null){
      // No prob
    } else {
      // Créer le lien entre l'admin et le groupe
      $linkAdmin = new LinkWorkspaceUser();
      $linkAdmin->setUser($admin);
      $linkAdmin->setGroup($newTwake);
      $linkAdmin->setUsernamecache("Admin");
      $linkAdmin->setStatus('A');
      $linkAdmin->setLevel($this->leveladmin);
      $manager->persist($linkAdmin);
      $manager->flush();
    }

    /**
     * Validation and Creation of Messagerie App
     */

    $messagerieUserRights = Array(
      "general" => Array(
        "create" => true,
        "view" => true,
        "post" => true,
        "pin" => true
      )
    );

    $data = Array(
      "shortDescription" => "La messagerie surpuissante de Twake : chaines de discussion, recherche avancée, visio-conférence et partage d'écran, messages épinglés...",
      "description" => "La messagerie surpuissante (et de base) de Twake.
Fonctionnalités :
- chaines de discussion privées et publiques,
- recherche avancée par date, utilisateurs et contenu,
- visio-conférence, partage d'écran et audio-conférence,
- messages épinglés
- emojis
- styles des messages : italique, souligné, barré, gras, colorisation de code, mise en valeur des liens, citation de messages, affichage des images et upload de fichiers
- commandes (\signal par exemple)",
      "name" => "Messages",
      "url" => "messages-auto",
      "icon" => "messagerie.svg",
      "cover" => "messageriecover.jpg",
      "screens" => Array(
        "mess1.png",
        "mess2.png",
        "mess3.png"
      ),
      'external'=>false,
      'all'=>true,
      'rights'=>$messagerieUserRights
    );

    $this->verifyApp($data);

    /**
     * Validation and Creation of Drive App
     */
    $driveUserRights = Array(
      "general" => Array(
        "create" => true,
        "view" => true,
        "edit" => true
      )
    );

    $data = Array(
      "name" =>"Drive",
      "url" => 'drive',
      "icon" => 'drive.svg',
      "cover" => 'drivecover.jpg',
      "external" => false,
      "all" => true,
      "rights"=>$driveUserRights
    );

    $this->verifyApp($data);

   /**************************
   * Creation des catégories
   **************************/

   $this->createCategories($manager);

  /**************************
   * Creation des niveaux de prix
   **************************/

	if ($force) {
		$priceLevels = $manager->getRepository("TwakePaymentsBundle:PriceLevel")->findAll();
		foreach ($priceLevels as $level) {
			$manager->remove($level);
		}
		$manager->flush();

		$prices = Array("Premium" => 10, "Gold" => 25, "Ultra gold premium +++" => 250);
		foreach ($prices as $name => $value) {
			$priceLevel = new PriceLevel($name, $value);
			$manager->persist($priceLevel);
		}
	}



	  /**
     * RECOVERY CASE, ADDING EVERY LINK NECESSARY
     */

    if ($force){
      $this->generateLinks();
    }
    $endtime = microtime(true);
    $timediff = $endtime - $starttime;

    $output->writeln('Time for initialization : '.$timediff.' secondes');
    return 0;

  }

  private function generateLinks(){
    $output = $this->output;
    $doctrine = $this->getContainer()->get('doctrine');
    $manager = $doctrine->getManager();
    $repoWorkspace = $manager->getRepository('TwakeWorkspacesBundle:Workspace');
    $workspaces = $repoWorkspace->findAll();



    $output->writeln("Total recovery initialized");
    $output->writeln("Restauration des liens spécifiques : ");
    $output->writeln("");

    // Restauration des liens spécifiques (whiteboard, ...)
    foreach($this->newApps['notall'] as $app){
      foreach($app['groups'] as $group){
        $link = new LinkAppWorkspace();
        $link->setGroup($group);
        $link->setApplication($app['app']);
        $app['app']->addUser();
        $manager->persist($link);
      }
      $output->writeln("Restauration de ".$app['app']->getName()." terminée");
      $manager->persist($app['app']);
    }

    // Restauration des liens universels (drive, messagerie)
    $output->write("Restauration des liens universels : ");
    foreach($workspaces as $workspace){
      foreach($this->newApps['all'] as $app) {
        $link = new LinkAppWorkspace();
        $link->setGroup($workspace);
        $link->setApplication($app);
        $app->addUser();
        $manager->persist($link);
      }
    }
    $output->writeln("terminée");

    foreach($this->newApps['all'] as $app){
      $manager->persist($app);
    }
    // Flush
    $output->writeln("");
    $output->writeln("");

    $output->writeln("Flush - This could take a while");
    $manager->flush();
  }


  private function createApp($data, $userRights){
    $doctrine = $this->getContainer()->get('doctrine');
    $manager = $doctrine->getManager();


    $newApp = new Application();
    $newApp->setGroup($data['workspace']);
    $newApp->setName($data['name']);
    $newApp->setUrl($data['url']);
	  if (isset($data['checkUrl'])) {
		  $newApp->setCheckUrl($data['checkUrl']);
	  }
    $newApp->setUserRights($userRights);

    if (isset($data['icon'])){
      $icon = $this->addFile($data['icon'],"apps");
      $newApp->setThumbnail($icon);
    }

    if (isset($data['cover'])){
      $cover = $this->addFile($data['cover'],'covrapps');
      $newApp->setCover($cover);
    }

    if (isset($data["screens"])){
      $screens = Array();

      foreach ($data['screens'] as $screen){
        $scr = $this->addFile($screen, "scrnapps");
        $screens[] = $scr->getId();
      }
      $newApp->setScreenshot($screens);
    }

	  if (isset($data['description'])){
		  $newApp->setDescription($data['description']);
	  }

  if (isset($data['shortDescription'])){
	  $newApp->setShortDescription($data['shortDescription']);
  }


    $manager->persist($newApp);
    $manager->flush();

    $newApp->generePublicKey();

	if (isset($data['publicKey'])){
	  $newApp->setPublicKey($data['publicKey']);
	}

	if (isset($data['privateKey'])){
	  $newApp->setPrivateKey($data['privateKey']);
	}


    $manager->persist($newApp);
    $manager->flush();

    return $newApp;

  }

  private function createTwake($manager){
    $newTwake = new Workspace();
    $newTwake->setName("Twake");
    $newTwake->setOfficial(true);
    $newTwake->setCleanName("twake");
    $newTwake->setType('O');
    $newTwake->setPrivacy('P');

    $logo = $this->addFile('twake.png','logo');
    $newTwake->setLogo($logo);

    $general = new Channel($newTwake, "general", 0);

    $levelAdmin = new Level();
    $levelAdmin->setName("Admin");
    $levelAdmin->setGroup($newTwake);
    $levelAdmin->setRight(Array());
    $levelAdmin->setOwner(1);
    $levelAdmin->setDefault(false);


    $droitDefault = Array(
      "base" => Array(
        "members" => Array(
          "invite" => false,
          "view" => true,
        ),
        "links" => Array(
          "view" => true
        ),

      ),
      "Messages" => Array(
        "general"=>Array(
          "view" => true,
          "post" => true
        )
      ),
      "Drive" => Array(
        "general"=>Array(
          "create"=>true,
          "view"=>true,
          "edit"=>true
        )
      )
    );

    $levelDefault = new Level();
    $levelDefault->setName("Default");
    $levelDefault->setGroup($newTwake);
    $levelDefault->setRight($droitDefault);
    $levelDefault->setOwner(0);
    $levelDefault->setDefault(true);


    $manager->persist($levelAdmin);
    $manager->persist($levelDefault);
    $manager->persist($general);
    $manager->persist($newTwake);
    $manager->flush();

    $this->leveladmin = $levelAdmin;
    return $newTwake;
  }

  private function createCategories($manager){
    $categories = Array(
      "gestion",
      "planification",
      "communication",
      "productivité",
      "jeux",
      "conception",
      "édition",
      "divers"
    );

    $repoCategories = $manager->getRepository('TwakeMarketBundle:Category');
    foreach($categories as $categorie){
      $categ = $repoCategories->findOneBy(Array("name"=>$categorie));
      if($categ==null){
        $categ = new Category();
        $categ->setName($categorie);
        $manager->persist($categ);
      }
    }

    $manager->flush();
  }

  private function verifyApp($data){
    $doctrine = $this->getContainer()->get('doctrine');
    $manager = $doctrine->getManager();
    $repoApp = $manager->getRepository("TwakeMarketBundle:Application");
    $repoLinkAppWorkspace = $manager->getRepository("TwakeMarketBundle:LinkAppWorkspace");
    $repoLinkAppUser = $manager->getRepository("TwakeMarketBundle:LinkAppUser");
    $app = $repoApp->findOneBy(Array('name' => $data['name']));
    $appGroups = Array();
    $addApp = false;
    if ($app != null){
      if ($this->force){
        // Must delete app and add it anew
        // First, must suppress every link with app;
        $links = $repoLinkAppWorkspace->findBy(Array("application" => $app));
        foreach ($links as $link){
          $appGroups[] = $link->getGroup();
          $manager->remove($link);
        }
        $links = $repoLinkAppUser->findBy(Array("application"=>$app));
        foreach ($links as $link){
          $manager->remove($link);
        }


        $manager->remove($app);

        $addApp = true;
      }
    } else {
      $addApp = true;
    }


    if ($addApp) {

      $data['workspace'] = $this->twake;
      $app = $this->createApp($data, $data['rights']);
      if ($data['all']){
        $this->newApps['all'][] = $app;
      } else {
        $this->newApps['notall'][] = Array('app'=>$app, "groups"=>$appGroups);
      }
    } else {
    }

    $this->output->writeln("");
    $this->output->writeln($data['name']." application ".($addApp?"added":"verified")." , Id of this application is : ".$app->getId());
    $this->output->writeln("");

    return $app;
  }
}