<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 22/06/2017
 * Time: 16:49
 */

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\HttpFoundation\JsonResponse;


class PrepareCommand extends ContainerAwareCommand
{


	var $minifier;
	var $default;
	var $mainapp = "";
	var $libsList = Array(
		"electron.js",
		"libs/jquery-ui/external/jquery/jquery.js",
		"libs/jquery-ui/jquery-ui.min.js",
		"libs/angular.min.js",
		"parameters.js",
		"common.js",
		"libs/moment.js",
		"libs/hammer.js",
		"libs/fastclick.js",
		"libs/emojione/emojione.min.js",
		"libs/angular-translate/1angular-translate.js",
		"libs/angular-translate/2angular-translate-loader-url.js"
	);
	var $newName = "angular_prod";
	var $cleaner;
	/**
	 * @var OutputInterface
	 */
	var $output;
	var $kernel;

	protected function configure()
	{
		$this
			->setName("twake:prepare")
			->setDescription("Command to translate the views and uglify everything")
			->addOption(
				"dev",
				"d",
				InputOption::VALUE_NONE,
				"Reset Dev Mode (with complete file and everything)"
			)
			->addOption(
				'update',
				"u",
				InputOption::VALUE_NONE,
				"Update the server"
			);
	}

	private function rrmdir($dir)
	{
		if (is_dir($dir)) {
			$objects = scandir($dir);
			foreach ($objects as $object) {
				if ($object != "." && $object != "..") {
					if (filetype($dir . "/" . $object) == "dir") {
						$this->rrmdir($dir . "/" . $object);
					} else {
						unlink($dir . "/" . $object);
					}
				}
			}
			reset($objects);
			rmdir($dir);
		}
	}

	protected function execute(InputInterface $input, OutputInterface $output)
	{
		if ($input->getOption("update")) {
			$command = $this->getApplication()->find('Twake:prepare');

			$arguments_switch = array(
				'command' => 'Twake:prepare',
				'--dev' => true,
			);

			$arguments_do = array(
				'command' => 'Twake:prepare'
			);

			$switch = new ArrayInput($arguments_switch);
			$do = new ArrayInput($arguments_do);
			$returnCode = $command->run($switch, $output);
			if ($returnCode != 0) {
				return $returnCode;
			}
			$returnCode = $command->run($do, $output);
			if ($returnCode != 0) {
				return $returnCode;
			}
			$returnCode = $command->run($switch, $output);
			return $returnCode;


		}
		$this->minifier = $this->getApplication()->getKernel()->getContainer()->get('app.minifier');
		$this->cleaner = $this->getApplication()->getKernel()->getContainer()->get('app.string_cleaner');
		$this->kernel = $this->getApplication()->getKernel()->getContainer()->get('kernel');
		$this->output = $output;

		$rootDir = dirname($this->kernel->getRootDir());
		$basedir = $rootDir . '/web/angular/';
		$this->default = $rootDir . "/src/Website/PublicBundle/Resources/views/Default/";
		$frDir = $rootDir . '/web/translations/fr/';
		$arr = Array();

		if ($input->getOption("dev")) {


			$controller = $rootDir . "/src/Website/PublicBundle/Controller/DefaultController.php";
			$content = file_get_contents($controller);
			if (!file_exists($basedir . "libs/")) {
				// Currently on prod
				$output->writeln("Current mode : prod");

				if (!file_exists($rootDir . '/web/angular_dev')) {
					$output->writeln("No /angular_dev exists ! Abort !");
					die;
				}

				$output->writeln("Switch to dev env and save prod mode");

				$content = str_replace("var \$dev = false", "var \$dev = true", $content);

				rename($rootDir . '/web/angular', $rootDir . '/web/angular_prod');
				rename($rootDir . '/web/angular_dev', $rootDir . '/web/angular');
				$this->rrmdir($rootDir . '/web/angular_prod');

			} else {
				// Currently on dev
				$output->writeln("Current mode : dev");

				if (!file_exists($rootDir . '/web/angular_prod')) {
					$output->writeln("No /angular_prod exists, first enter twake:prepare command to generate this folder ! Abort !");
					die;
				}

				$output->writeln("Switch to prod env and save dev mode");

				$content = str_replace("var \$dev = true", "var \$dev = false", $content);

				rename($rootDir . '/web/angular', $rootDir . '/web/angular_dev');
				rename($rootDir . '/web/angular_prod', $rootDir . '/web/angular');
			}
			file_put_contents($controller, $content);


			return 0;
		} else if (!file_exists($basedir . "libs/")) {
			$output->writeln("Error, can't work on prod angular");
			return 1;
		}

		// This function will do everything HTML related
		$this->scanHTML($basedir, $arr);

		// This function will do everything JS related
		$this->allJS($basedir);

		// This function will do everything CSS related
		$this->allCSS($basedir, $rootDir);

		if (!file_exists($frDir)) {
			mkdir($frDir, 0777, true);
		}
		foreach ($arr as $dirname => $trad) {
			file_put_contents($frDir . basename($dirname) . ".json", json_encode($trad, JSON_PRETTY_PRINT));
		}
		return 0;

	}

	protected function allCSS($basedir, $rootDir)
	{
		//Jsdir contain the path to the new css directory
		$cssdir = str_replace('angular', "angular_prod", $basedir) . "css/";
		if (!file_exists($cssdir)) {
			mkdir($cssdir, 0777, true);
		}

		//First, we'll get the libs css
		$this->getCSS($basedir, $cssdir, "libs");

		//Second, we'll get our styles
		$this->getCSS($basedir, $cssdir, "styles");

		//Finally, we update the index.html.twig
		$target = $this->default . "index.html.twig";
		$public = file_get_contents($target);

		$text = "<link rel=\"stylesheet\" href=\"/angular/css/libs.css\"/>";
		$public = preg_replace('/<!-- CSSLIBS_BEGIN -->[\s\S]*<!-- CSSLIBS_END -->/', $text, $public);

		$text = "<link rel=\"stylesheet\" href=\"/angular/css/styles.css\"/>";
		$public = preg_replace('/<!-- CSSSTYLE_BEGIN -->[\s\S]*<!-- CSSSTYLE_END -->/', $text, $public);

		file_put_contents($target, $public);
	}

	public function getCSS($basedir, $cssdir, $type)
	{
		$css = "";
		$path = $basedir . $type . "/";
		$files = glob($path . '*', GLOB_MARK); //GLOB_MARK adds a slash to directories returned
		foreach ($files as $file) {
			$this->scanSecondaryCSS($file, $css);
		}
		file_put_contents($cssdir . $type . ".css", $css);
	}


	function scanSecondaryCSS($target, &$sec)
	{
		if (is_dir($target)) {

			$files = glob($target . '*', GLOB_MARK); //GLOB_MARK adds a slash to directories returned
			foreach ($files as $file) {
				$this->scanSecondaryCSS($file, $sec);
			}
		} else if (preg_match('/\\.css$/', $target)) {

			//Put here any minification
			$content = file_get_contents($target);
			$sec = $sec . $this->minify_css($content);

		}
	}

	protected function allJS($basedir)
	{

		//Jsdir contain the path to the new js directory
		$jsdir = str_replace('angular', "angular_prod", $basedir) . "js/";

		//First, we'll get the primary libraries (defined in libpath and NOT concatenated)
		$this->primaryJS($basedir, $jsdir);

		//Second, we'll get all the services (and other things) (concatenated in service.js)
		$arr = $this->scanJS($basedir, $jsdir);

		//Third, we'll get all the app.js (concatenated in app.js)
		//This is done with the Second point !


		//Fourth, we'll get all the inner libraries (concatenated in innerlibs_X.js)
		//This function returns the amount of ~500Ko file created (all named : innerlibs_X.js )
		$i = $this->innerlibsJS($basedir, $jsdir);


		//Fifth, we'll get all our js files (concatenated by "app" in app_name.js )
		//This function returns an array containing amount of file created
		// This is done with the Second point !


		//Sixth, we'll reconstruct public.html.twig
		$this->createPublicHtmlTwig($i, $arr);

		//Seventh, we'll construct dev mode
		$this->createDevHtmlTwig($i);

	}

	protected function createDevHtmlTwig($i)
	{
		$rootDir = dirname($this->kernel->getRootDir());
		$public = file_get_contents($this->default . "public.html.twig");
		/*  This is not working and I have no idea why, so feel free to debug if you want.
		$text = "<!-- INNERLIBS_BEGIN -->\n";
		for ($j = 0; $j <= $i; $j++){
		  $text = $text."<script src='/angular/js/innerlibs_".$j.".js'></script>\n";
		}
		$text = $text."<!-- INNERLIBS_END -->";
		$public = preg_replace('/<!-- INNERLIBS_BEGIN -->[\s\S]*<!-- INNERLIBS_END -->/',$text,$public);
		*/
		file_put_contents($rootDir . "/src/Website/PublicBundle/Resources/views/Default/public-dev.html.twig", $public);
	}

	protected function createPublicHtmlTwig($i, $arr)
	{
		// Zero, we get the html template
		$rootDir = dirname($this->kernel->getRootDir());
		$public = file_get_contents($rootDir . "/src/Website/PublicBundle/Resources/views/Default/public.html.twig");

		// First ! Main libs
		$text = "";
		foreach ($this->libsList as $lib) {
			$text = $text . "<script src='/angular/js/" . basename($lib) . "'></script>\n    ";
		}
		$public = preg_replace('/<!-- MAIN_BEGIN -->[\s\S]*<!-- MAIN_END -->/', $text, $public);

		// Second ! Services
		$text = "<script src='/angular/js/services.js'></script>";
		$public = preg_replace('/<!-- SERVICE_BEGIN -->[\s\S]*<!-- SERVICE_END -->/', $text, $public);

		// Third ! App
		$text = "<script src='/angular/js/app.js'></script>";
		$public = preg_replace('/<!-- APP_BEGIN -->[\s\S]*<!-- APP_END -->/', $text, $public);

		// Third Bis! Our App
		$text = "<script src='/angular/js/app2.js'></script>";
		$public = preg_replace('/<!-- OURAPP_BEGIN -->[\s\S]*<!-- OURAPP_END -->/', $text, $public);

		// Fourth ! Inner Libs
		$text = "";
		for ($j = 0; $j <= $i; $j++) {
			$text = $text . "<script src='/angular/js/innerlibs_" . $j . ".js'></script>\n";
		}
		$public = preg_replace('/<!-- INNERLIBS_BEGIN -->[\s\S]*<!-- INNERLIBS_END -->/', $text, $public);


		// Fifth ! Our JS
		$text = "";
		foreach ($arr as $key => $value) {
			if ($key != "services") {
				$text = $text . "<script src='/angular/js/" . $key . ".js'></script>\n";
			}
		}
		$public = preg_replace('/<!-- OURJS_BEGIN -->[\s\S]*<!-- OURJS_END -->/', $text, $public);

		// Sixth ! CSS


		// Seventh !
		$target = $this->default . "index.html.twig";
		file_put_contents($target, $public);

	}

	protected function primaryJS($basedir, $jsdir)
	{

		foreach ($this->libsList as $link) {
			$target = $basedir . $link;
			$file = file_get_contents($target);
			$minified = $this->minifier->minify($file);

			$target2 = $jsdir . basename($target);
			if (!file_exists(dirname($target2))) {
				mkdir(dirname($target2), 0777, true);
			}
			file_put_contents($target2, $minified);
		}
	}

	function innerlibsJS($basedir, $jsdir)
	{

		$array = Array();
		$array2 = Array();
		$sec = Array();
		$sec[0] = "";
		$i = 0;
		$libpath = $basedir . "libs/";
		$rootDir = dirname($this->kernel->getRootDir());
		$public = file_get_contents($rootDir . "/src/Website/PublicBundle/Resources/views/Default/public.html.twig");
		preg_match_all('/<!-- INNERLIBS_BEGIN -->([\s\S]*)<!-- INNERLIBS_END -->/', $public, $array);
		$text = $array[1][0];
		preg_match_all('/src="\\/angular\\/libs\\/([\s\S]*?)"/', $text, $array2);
		foreach ($array2[1] as $file) {
			$file = $libpath . $file;
			if ($this->isNotImportant($file)) {
				$content = $this->minifier->minify(file_get_contents($file)) . "\n";
				// Verification that the actuel "innerlibs_X.js" does not exceed 500Ko and that adding this library won't make it
				// exceed 550 Ko.
				if (strlen($sec[$i]) + strlen($content) > 550000 || strlen($sec[$i]) > 500000) {
					$i++;
					$sec[$i] = "";
				}
				$sec[$i] = $sec[$i] . $content;
			}
		}

		for ($j = 0; $j <= $i; $j++) {
			file_put_contents($jsdir . "innerlibs_" . $j . ".js", $sec[$j]);
		}
		return $i;
	}


	function isNotImportant($target)
	{
		foreach ($this->libsList as $lib) {
			if (basename($lib) == basename($target)) {
				return false;
			}
		}
		return true;
	}


	function scanJS($basedir, $jsdir)
	{
		$files = glob($basedir . '*', GLOB_MARK); //GLOB_MARK adds a slash to directories returned
		$arr = Array();
		// app2 will contains all the app.js in the whole angular folder
		$app = "";

		foreach ($files as $file) {
			if (is_dir($file) && basename($file) != "libs" && basename($file) != "styles" && basename($file) != "views" && basename($file) != "js") {

				// str will contains all the js of this directory EXCEPT app.js
				$str = "";

				$this->scanJSFolder($file, $str, $app);
				$arr[basename($file)] = $str;
			}
		}

		file_put_contents($jsdir . "app.js", $this->mainapp);
		file_put_contents($jsdir . "app2.js", $app);
		foreach ($arr as $key => $data) {
			file_put_contents($jsdir . $key . ".js", $data);
		}
		return $arr;
	}

	function scanJSFolder($target, &$str, &$app)
	{
		if (is_dir($target)) {
			$files = glob($target . '*', GLOB_MARK); //GLOB_MARK adds a slash to directories returned
			foreach ($files as $file) {
				$this->scanJSFolder($file, $str, $app);
			}
		} else if (preg_match('/\\.js$/', $target)) {
			$file = file_get_contents($target) . ";";
			$minified = $this->minifier->minify($file);

			// Here we check if this file is a "app.js" or a regular js file
			if (basename($target) == "app.js" && basename(dirname(dirname($target))) != "public") {

				$app = $app . $minified;
			} else if (basename($target) == "app.js") {
				$this->mainapp = $minified;
			} else {
				$str = $str . $minified;
			}
		}
	}

	function scanHTML($target, &$arr)
	{

		if (is_dir($target)) {
			$files = glob($target . '*', GLOB_MARK); //GLOB_MARK adds a slash to directories returned
			foreach ($files as $file) {
				$this->scanHTML($file, $arr);
			}
		} else if (preg_match('/\\.html$/', $target) && !(basename(dirname(dirname($target))) == "public" && basename($target) == "general.html")) {


			$file = file_get_contents($target);

			if (strpos($file, "<script") !== false) {
				error_log("Error ! there is <script/> tag in " . $target . " ! ");
				die();
			}

			$file = str_replace("\r", "", $file);
			$file = str_replace("\n", "", $file);
			$file = str_replace("\t", "", $file);
			$file = str_replace("  ", " ", $file);

			$array = Array();
			$dirname = dirname($target);

			if (!isset($arr[$dirname])) {
				$arr[$dirname] = Array();
			}
			$remplace = Array();

			preg_match_all('/placeholder(?: )?=(?: )?"([^"]*)"/m', $file, $array);
			for ($j = 0; $j < count($array[1]); $j++) {
				$complete = $array[0][$j];
				$string = $array[1][$j];
				$arr[$dirname][$this->clean($string)] = $string;
				$remplace[$complete] = "placeholder=\"{{'" . $this->clean($string) . "' | translate }}\"";

			}

			preg_match_all("/>( )?([^< \\r\\n][^<>]*?)( )?<[^ ]/m", $file, $array);


			for ($j = 0; $j < count($array[2]); $j++) {
				$leftspace = $array[1][$j];
				$rightspace = $array[3][$j];
				$string = $array[2][$j];
				$complete = $array[0][$j];

				$remplace[$complete] = ">" . $leftspace;
				$explode1 = explode('{{', $string);
				for ($i = 0; $i < count($explode1); $i++) {
					if ($i == 0) {
						if ($this->cleaner->simplify($explode1[0]) != "") {
							$arr[$dirname][$this->clean($explode1[0])] = $explode1[0];
							$remplace[$complete] = $remplace[$complete] . "{{'" . $this->clean($explode1[0]) . "' | translate }}";
						} else if (preg_replace('/( |\\n|\\r|\\t)+/', '', $explode1[0]) != "") {

							$remplace[$complete] = $remplace[$complete] . $explode1[0];
						}
					} else {
						$explode2 = explode('}}', $explode1[$i]);
						$remplace[$complete] = $remplace[$complete] . '{{' . $explode2[0] . '}}';
						if ($this->cleaner->simplify($explode2[1]) != "") {
							if ($explode2[1][0] == " ") {
								$explode2[1] = substr($explode2[1], 1);
								$remplace[$complete] = $remplace[$complete] . " ";
							}
							$arr[$dirname][$this->clean($explode2[1])] = $explode2[1];

							$remplace[$complete] = $remplace[$complete] . "{{'" . $this->clean($explode2[1]) . "' | translate }}";
						} else if (preg_replace('/( |\\n|\\r|\\t)+/', '', $explode2[1]) != "") {
							$remplace[$complete] = $remplace[$complete] . $explode2[1];

						}
					}
				}

				$remplace[$complete] = $remplace[$complete] . $rightspace . "<" . substr($complete, -1);
			}

			if (count($arr[$dirname]) == 0) {
				unset($arr[$dirname]);
			} else {
				foreach ($remplace as $key => $value) {
					$file = str_replace($key, $value, $file);

				}
			}


			$target2 = str_replace("angular", $this->newName, $target);

			if (!file_exists(dirname($target2))) {
				mkdir(dirname($target2), 0777, true);
			}
			file_put_contents($target2, $file);

		} else if (preg_match('/\\.html$/', $target) && basename(dirname(dirname($target))) == "public" && basename($target) == "general.html") {
			$file = file_get_contents($target);
			$target2 = str_replace("angular", $this->newName, $target);
			if (!file_exists(dirname($target2))) {
				mkdir(dirname($target2), 0777, true);
			}
			file_put_contents($target2, $file);
		}
	}

	function clean($str)
	{
		return str_replace("'", " ", $str);
	}

	function minify_css($string)
	{
		$string = str_replace(array('  '), ' ', $string);
		$comments = <<<'EOS'
(?sx)
    # don't change anything inside of quotes
    ( "(?:[^"\\]++|\\.)*+" | '(?:[^'\\]++|\\.)*+' )
|
    # comments
    /\* (?> .*? \*/ )
EOS;

		$everything_else = <<<'EOS'
(?six)
    # don't change anything inside of quotes
    ( "(?:[^"\\]++|\\.)*+" | '(?:[^'\\]++|\\.)*+' )
|
    # spaces before and after ; and }
    \s*+ ; \s*+ ( } ) \s*+
|
    # all spaces around meta chars/operators (excluding + and -)
    \s*+ ( [*$~^|]?+= | [{};,>~] | !important\b ) \s*+
|
    # all spaces around + and - (in selectors only!)
    \s*([+-])\s*(?=[^}]*{)
|
    # spaces right of ( [ :
    ( [[(:] ) \s++
|
    # spaces left of ) ]
    \s++ ( [])] )
|
    # spaces left (and right) of : (but not in selectors)!
    \s+(:)(?![^\}]*\{)
|
    # spaces at beginning/end of string
    ^ \s++ | \s++ \z
|
    # double spaces to single
    (\s)\s+
EOS;

		$search_patterns = array("%{$comments}%", "%{$everything_else}%");
		$replace_patterns = array('$1', '$1$2$3$4$5$6$7');

		return preg_replace($search_patterns, $replace_patterns, $string);
	}
}