<?php

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class GeneralPagesController extends Controller
{
	public function startPageAction()
	{

		$data = Array(
			"name" => "Accueil",
		);
		$response = $this->render('TwakeCoreBundle:Public:startPage.html.twig', $data);

		return $response;

	}


	public function scriptsAction($script)
	{
		$request = Request::createFromGlobals();
		if($script=="getBackground"){
			return $this->getBackground($request);
		}
		return new JsonResponse(array('status'=>"error",'errors'=>Array('no_such_script')));
	}

	private function getBackground($request){

		$backgrounds = Array(
			"/public/img/start_backgrounds/Children_with_music.jpg",
			"/public/img/start_backgrounds/4954982632_e2e2d58989_b.jpg",
			"/public/img/start_backgrounds/5269147992_cf7a153354_b.jpg",
			"/public/img/start_backgrounds/4954982632_e2e2d58989_b.jpg",
			"/public/img/start_backgrounds/5269147992_cf7a153354_b.jpg"
		);

		$number = 1;
		if($request->query->get('n')!=null){
			$number = min($request->query->get('n'), count($backgrounds));
		}

		shuffle($backgrounds);

		return new JsonResponse(array('data' => array_slice($backgrounds,0,$number)));

	}

}
