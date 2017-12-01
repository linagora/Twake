<?php

/**
 * See doc/js/ajax_center.html
 */

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class AjaxCenterController extends Controller
{

	var $identifiers = Array(
		"debug" => "TwakeCoreBundle:AjaxCenter:debug",
		"notifications" => "TwakeUsersBundle:Notifications:get",
		"messages_notifications" => "TwakeDiscussionBundle:Discussion:getAjaxCenterNotifications"
	);

	public function getAction()
	{

		$request = Request::createFromGlobals();

		$res = Array();

		foreach (explode(",",$request->query->get('need')) as $need) {

			if(isset($_POST[$need]["_script"]) && isset($this->identifiers[$_POST[$need]["_script"]])){

				$parameters = $_POST[$need];

				//Appeler la bonne méthode dans le bon controller
				$res[$need] =
					json_decode($this->forward($this->identifiers[$_POST[$need]["_script"]], Array("query"=>$parameters))->getContent(), true);


			}

		}

		//Set current user as online
		$securityContext = $this->get('security.authorization_checker');
		if ($securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$this->getUser()->setOnline();
			$this->getDoctrine()->getManager()->persist($this->getUser());
			$this->getDoctrine()->getManager()->flush();
		}

		return new JsonResponse($res);

	}

	public function debugAction($query){

		return new JsonResponse(Array("reçu"=>$query));

	}


}
