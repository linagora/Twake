<?php

namespace WebsiteApi\UsersBundle\Controller;

use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\HttpFoundation\JsonResponse;
use FOS\UserBundle\Controller\SecurityController as BaseController;
use FOS\UserBundle\Event\FilterUserResponseEvent;
use FOS\UserBundle\Event\FormEvent;
use FOS\UserBundle\Event\GetResponseUserEvent;
use FOS\UserBundle\Form\Factory\FactoryInterface;
use FOS\UserBundle\FOSUserEvents;
use FOS\UserBundle\Model\UserInterface;
use FOS\UserBundle\Model\UserManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use FOS\UserBundle\Util\CanonicalFieldsUpdater;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;
use Symfony\Component\Security\Core\Exception\UsernameNotFoundException;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\Security\Http\RememberMe\TokenBasedRememberMeServices;
use FOS\UserBundle\Security\EmailUserProvider;

use Symfony\Component\HttpFoundation\Cookie;

class CurrentUserController extends BaseController
{

	/**
	 * Get the current user basic infos
	 *
	 * ### Response ###
	 *
	 * {
	 *   "errors": []
	 *   "data": {
	 *     "status": "notconnected"/"connected"
	 *     "uid": INT
	 *     "username": Username
	 *     "susername": Username formated for urls
	 *     "userimage": CSS for user image
	 *     "usercover": CSS for user cover
	 *  }
	 *
	 * ### Errors ###
	 *
	 * None.
	 *
     * @ApiDoc(
	 *  parameters = {
	 *  },
	 *
	 *  views = { "ajax" },
	 *  section = "Current Session"
     * )
     */
	public function getAction(Request $request){

		$response = Array(
			"data" => Array(),
			"errors" => Array()
		);

		//Vérifier la connexion
		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$response["data"] = Array(
				"status" => "notconnected"
			);

		}else {
			$workspaces = $this->getUser()->getWorkspaces();

			$groups = Array();
			foreach ($workspaces as $workspace) {
			    if($workspace->getIsDeleted() == false){
				    $groups[]
					    = $workspace->getAsSimpleArray();
                }
			};


			$response["data"] = Array(
				"status" => "connected",
				"uid" => $this->getUser()->getId(),
				"username" => $this->getUser()->getUsername(),
				"susername" => $this->getUser()->getUsernameClean(),
				"cssuserimage" => $this->getUser()->getCssProfileImage(),
				"cssusercover" => $this->getUser()->getCssCoverImage(),
				"userimage" => $this->getUser()->getUrlProfileImage(),
				"usercover" => $this->getUser()->getUrlCoverImage(),
				"isadmin" => in_array("ADMIN",$this->getUser()->getRoles()),
				"groups" => $groups,
			);

		}

		return new JsonResponse($response);

	}


	public function getnotificationsAction(Request $request){

		$limit = 50;
		$offset = 0;

		if($request->request->has("limit")){
			$limit = $request->request->get("limit");
		}
		if($request->request->has("offset")){
			$offset = $request->request->get("offset");
		}

		return new JsonResponse($this->get('app.notifications')->get($this->getUser(),true,$limit,$offset));

	}

	public function readnotificationsAction(Request $request){

		$this->get('app.notifications')->readById($request->request->get("notif"));

		return new JsonResponse($request->request->get("notif"));
	}

	public function readallnotificationsAction(Request $request){

		$this->get('app.notifications')->readAll($this->getUser());

		return new JsonResponse();
	}

}
