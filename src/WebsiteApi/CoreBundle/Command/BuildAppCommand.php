<?php
namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ConfirmationQuestion;
use Symfony\Component\Finder\Finder;
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


class BuildAppCommand extends ContainerAwareCommand
{


	protected function configure()
	{
	$this
	  ->setName("twake:buildapp")
	  ->setDescription("Command to initialize the server, notably filling the database with crucial data")
	  ;
	}

	protected function execute(InputInterface $input, OutputInterface $output)
	{

		//Services
		$this->kernel = $this->getApplication()->getKernel()->getContainer()->get('kernel');

		//Vérifications
		$helper = $this->getHelper('question');
		$question = new ConfirmationQuestion('Delete old /build/ subdirectories (public, angular, index.html) and contents if exists? [Y]', false);

		if (!$helper->ask($input, $output, $question)) {
			return 0;
		}

		//Prepare
		$output->writeln("Prepare (compressing js and css)...");
		$command = $this->getApplication()->find('twake:prepare');
		$arguments = array(
			'command' => 'twake:prepare'
		);
		$greetInput = new ArrayInput($arguments);
		$returnCode = 0;
		$returnCode = $command->run($greetInput, $output);


		if ($returnCode == 0) {

			//Start building app

			$rootDir = dirname($this->kernel->getRootDir());

			//Generate build directory and empty it
			$output->writeln("Generate build directories...");

			if (file_exists($rootDir . "/build/public")) {
				$this->deleteDirectory($rootDir . "/build/public");
			}
			if (file_exists($rootDir . "/build/angular")) {
				$this->deleteDirectory($rootDir . "/build/angular");
			}
			if (file_exists($rootDir . "/build/index.html")) {
				unlink($rootDir . "/build/index.html");
			}
			if (!file_exists($rootDir . "/build/")) {
				mkdir($rootDir . "/build/");
			}

			//Copy angular_prod and public
			$output->writeln("Copy compressed js and css...");

			$this->copy_directory($rootDir . "/web/angular_prod", $rootDir . "/build/angular");
			$this->copy_directory($rootDir . "/web/public", $rootDir . "/build/public");
			copy($rootDir . "/src/Website/PublicBundle/Resources/views/Default/index.html.twig", $rootDir . "/build/index.html");

			//Modify all absolutes links /angular/ and /public/
			$output->writeln("Replace absolute links starting by /angular or /public...");

			$finder = new Finder();
			$finder->files()->in($rootDir . "/build/")
				->name('*.html');
			foreach ($finder as $file) {
				$this->replaceAbsolutePaths($rootDir . "/build/", $file->getRealPath());
			}
			$finder = new Finder();
			$finder->files()->in($rootDir . "/build/")
				->name('*.js');
			foreach ($finder as $file) {
				$this->replaceAbsolutePaths($rootDir . "/build/", $file->getRealPath());
			}
			$finder = new Finder();
			$finder->files()->in($rootDir . "/build/")
				->name('*.css');
			foreach ($finder as $file) {
				$this->replaceAbsolutePaths($rootDir . "/build/", $file->getRealPath());
			}

			//Add js window.standalone = true;
			$output->writeln("Remove twig and set as standalone...");

			$indexContent = file_get_contents($rootDir . "/build/index.html");
			$indexContent = str_replace("<head>", "<head>\n<script type='text/javascript'>window.standalone = true;</script>", $indexContent);
			$indexContent = str_replace("href=\"/\"", "href=''", $indexContent);

			//Remove twig
			$indexContent = preg_replace("/\\{\\{ *('|\")\\{\\{/", "{{", $indexContent);
			$indexContent = preg_replace("/\\}\\}('|\") *\\}\\}/", "}}", $indexContent);

			file_put_contents($rootDir . "/build/index.html", $indexContent);

			$output->writeln("Done !");

		}

	}

	private function deleteDirectory($dir) {
		if (!file_exists($dir)) {
			return true;
		}

		if (!is_dir($dir)) {
			return unlink($dir);
		}

		foreach (scandir($dir) as $item) {
			if ($item == '.' || $item == '..') {
				continue;
			}

			if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
				return false;
			}

		}

		return rmdir($dir);
	}

	private function copy_directory($src, $dst)
	{
		$dir = opendir($src);
		@mkdir($dst);
		while (false !== ($file = readdir($dir))) {
			if (($file != '.') && ($file != '..')) {
				if (is_dir($src . '/' . $file)) {
					$this->copy_directory($src . '/' . $file, $dst . '/' . $file);
				} else {
					copy($src . '/' . $file, $dst . '/' . $file);
				}
			}
		}
		closedir($dir);
	}

	private function replaceAbsolutePaths($buildDir, $path){
		$content = file_get_contents($path);

		//get extension :
		$ext = explode(".", $path);
		$ext = $ext[count($ext)-1];

		$relativeness = "";
		if($ext=="css"){ // Path should be relative to css position
			$diff = dirname(substr(realpath($path), strlen(realpath($buildDir))));
			$relativeness = str_repeat("../", count(explode("/",$diff))-1);
		}

		$content = preg_replace("/([^a-zA-Z0-9])\\/angular\\//", "$1".$relativeness."angular/",$content);
		$content = preg_replace("/([^a-zA-Z0-9])\\/public\\//", "$1".$relativeness."public/",$content);
		file_put_contents($path, $content);
	}

}