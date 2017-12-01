<?php

namespace Website\PublicBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends Controller
{
	// DO NOT TOUCH THE FOLLOWING LINE, IT IS VERY VERY IMPORTANT
	var $dev = true; // DO NOT TOUCH THIS LINE, IT IS VERY VERY IMPORTANT
	// DO NOT TOUCH THE PRECEDING LINE, IT IS VERY VERY IMPORTANT
	//For all routes, load angular app and display good state

	public function allAction(Request $request)
	{
		if ($this->dev) {
			$apppath = "/angular/public/";
			$apppathgroups = "/angular/group/";
			$appscripts = Array();
			$appscriptsgroups = Array();

			//TODO To remove in prod !!!
			$source = realpath($this->get('kernel')->getRootDir() . '/../web');
			$finder = new Finder();
			$finder->files()->in($source . $apppath . "scripts")
				->name('*.js');
			foreach ($finder as $file) {
				if (substr($file->getRealPath(), strlen($file->getRealPath()) - 6, 6) != "app.js") {
					$appscripts[] = substr($file->getRealPath(), strlen($source . $apppath . "scripts"));
				}
			}
			$finder = new Finder();
			$finder->files()->in($source . $apppathgroups . "scripts")
				->name('*.js');
			foreach ($finder as $file) {
				if (substr($file->getRealPath(), strlen($file->getRealPath()) - 6, 6) != "app.js") {
					$appscriptsgroups[] = substr($file->getRealPath(), strlen($source . $apppathgroups . "scripts"));
				}
			}

			//Idem styles
			$appstyles = Array();
			$finder = new Finder();
			$finder->files()->in($source . "/angular/styles")
				->name('*.css');
			error_log($source . $apppath);
			foreach ($finder as $file) {
				$appstyles[] = substr($file->getRealPath(), strlen($source . "/angular/styles"));
			}

			//Idem services
			$appservices = Array();
			$finder = new Finder();
			$finder->files()->in($source . "/angular/services")
				->name('*.js');
			foreach ($finder as $file) {
				$appservices[] = substr($file->getRealPath(), strlen($source . "/angular/services"));
			}

			$req = $request->attributes->get('req');
			return $this->render(
				'WebsitePublicBundle:Default:public-dev.html.twig',
				Array(
					"state" => $req,
					"appscripts" => $appscripts,
					"appscriptsgroups" => $appscriptsgroups,
					"services" => $appservices,
					"apppath" => $apppath,
					"apppathgroups" => $apppathgroups,
					"styles" => $appstyles
				)
			);
		} else {
			return $this->render('WebsitePublicBundle:Default:index.html.twig');
		}
	}
}
