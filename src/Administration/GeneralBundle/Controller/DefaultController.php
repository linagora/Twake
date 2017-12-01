<?php

namespace Administration\GeneralBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Finder\Finder;

class DefaultController extends Controller
{
	//For all routes, load angular app and display good state
	public function allAction(Request $request)
	{
		$apppath = "/angular/administration/";
		$appscripts = Array();

		//TODO To remove in prod !!!
		$source =  realpath($this->get('kernel')->getRootDir() . '/../web');
		$finder = new Finder();
		$finder->files()->in($source.$apppath."scripts")
			->name('*.js');
		error_log($source.$apppath);
		foreach ($finder as $file) {
			if(substr($file->getRealPath(), strlen($file->getRealPath())-6, 6)!="app.js") {
				$appscripts[] = substr($file->getRealPath(), strlen($source . $apppath . "scripts"));
			}
		}

		//Idem styles
		$appstyles = Array();
		$finder = new Finder();
        $finder->files()->in($source . "/angular/administration/styles")
			->name('*.css');
		error_log($source.$apppath);
		foreach ($finder as $file) {
            $appstyles[] = substr($file->getRealPath(), strlen($source . "/angular/administration/styles"));
		}

		$req = $request->attributes->get('req');
		return $this->render(
			'AdministrationGeneralBundle:Default:admin.html.twig',
			Array(
				"state"=>$req,
				"appscripts"=>$appscripts,
				"apppath"=>$apppath,
		        "styles"=>$appstyles
			)
		);
	}

}
