<?php

namespace WebsiteApi\UsersBundle\Controller;

use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use WebsiteApi\UsersBundle\Entity\Contact;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Request;

/**
 * Class NotificationsController
 * @package WebsiteApi\UsersBundle\Controller
 *
 * Cette classe gère toutes les demandes ajax de contrôle des amis
 * (ajout, suppression, acceptation, refus)
 *
 */
class ContactController extends Controller
{

    /*
     * Recevoir le script
     */
	public function scriptsAction($script,Request $request)
	{

        $securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			return new JsonResponse(array('status'=>"error",'errors'=>Array('notconnected')));
		}

		if($script=="accept"){
			return $this->accept($request);
		}
		if($script=="remove"){
			return $this->remove($request);
		}
		if($script=="refuse"){
			return $this->remove($request);
		}
		if($script=="ask"){
			return $this->ask($request);
		}
		if($script=="user"){
            return $this->getRelation($request);
		}
		if($script=="getall"){
			return $this->getAllContacts($request);
		}
		return new JsonResponse(array('status'=>"error",'errors'=>Array('no_such_script')));
	}


	/**
	 * Accept a request, user_id is passed in POST
	 * Can only accept a request where we're not the sender of the request
	 *
	 * @param $request
	 * @return JsonResponse
	 */
	public function accept(Request $request){

		$res = $this->get('app.contacts')->accept($this->getUser(), $request->request->getInt("user_id",0));
		return new JsonResponse($res);

	}

	/**
	 * @param $request
	 * @return JsonResponse
	 *
	 * Any user at any time can remove any of its relations, user_id is passed in POST
	 *
	 */
	public function remove($request){
		$res = $this->get('app.contacts')->remove($this->getUser(), $request->request->getInt("user_id",0));
		return new JsonResponse($res);
	}

	/**
	 * @param $request
	 * @return JsonResponse
	 *
	 * Ask for new relation, user_id is passed in POST
	 *
	 * An user cannot be friend of itself
	 * if the relation exists, may be its waiting an acceptation so the function returns the result of accept in this case
	 *
	 */
	public function ask($request){
		$res = $this->get('app.contacts')->ask($this->getUser(), $request->request->getInt("user_id",0));
		return new JsonResponse($res);
	}

	/**
	 * Retourne la relation vis ) vis d'un utilisateur
	 *
	 * @param $request
	 * @return JsonResponse
	 */
	function getRelation($request){

		$res = $this->get('app.contacts')->getRelation($this->getUser(), $request->request->getInt("user_id",0));
		return new JsonResponse($res);
	}

	/**
	 * Retourne la liste complète des contacts
	 * @param $request
	 */
	function getAllContacts($request){
    $res = $this->get('app.contacts')->getAllContacts($this->getUser());
    if ($request->request->has("notall")){
      $arr = Array();
      foreach ($res['results'] as $contact){
        if ($contact["status"] == "A"){
          $arr[] = $contact;
        }
      }
      $res['results'] = $arr;
    }
		return new JsonResponse($res);

	}



}