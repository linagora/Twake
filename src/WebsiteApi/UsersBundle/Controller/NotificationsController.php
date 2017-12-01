<?php

namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Request;

//-----> NOT USED

class NotificationsController extends Controller
{

	public function testAction(){
		
		$this->get("app.notifications")->push(
			$this->getUser(),
			$this->getUser(),
			"test",
			["classic","fast"],
			Array(
				"title"=>"Titre",
				"text"=>"Super texte",
				"url"=>"user/romaric",
				"img"=>"https://www.w3schools.com/css/trolltunga.jpg"
			)
		);

		return new JsonResponse(Array());
	}

	public function indexAction(){

		$data = Array(

		);

		return $this->render('TwakeUsersBundle:Account:account_notifications.html.twig', $data);

	}

	//Called by the AjaxCenter, returns some notifications after last sended notification ($query['last_id_sent'])
	public function getAction($query){


		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			return new JsonResponse(array('status'=>"error",'errors'=>Array('not_connected')));
		}

		$last_id_sent = 0;
		if(isset($query['last_id_sent'])){
			$last_id_sent = intval($query['last_id_sent']);
		}
		$last_id = $last_id_sent;

		$onlynotviewed = true;
		$number = 100;
		if($last_id_sent == 0){
			$number = 10;
			$onlynotviewed = false;
		}

		$notifications = $this->get('app.notifications')->getNotifications(
			$this->getUser(), $onlynotviewed, $number, $last_id_sent);

		$notification_forjson = Array();

		foreach($notifications as $notification){

			$data = $notification->getData();

			$data["objecttype"] = $notification->getObjectType();
			$data["isnew"] = !$notification->getViewed();
			$data["isopened"] = $notification->isOpen();
			$data["transport"] = $notification->getTransport();
			$data["id"] = $notification->getId();

			$data["hasImg"] = strlen($notification->getData()["img"])>1;

			$data["date"] = $this->get('app.string_cleaner')->getElapsedTime($notification->getDate());

			$notification_forjson[] = $data;

			$last_id = max($last_id, $notification->getId());
		}


		return new JsonResponse(Array("last_id"=>$last_id, "notifications"=>$notification_forjson));

	}

	/**
	 * Set list of notifications as opened
	 */
	public function setOpenAction(){


		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			return new JsonResponse(array('status'=>"error",'errors'=>Array('not_connected')));
		}

		$request = Request::createFromGlobals();

		$notifications_id = $request->request->get("notifications_id","");
		$notifications_id = explode(",",$notifications_id);

		$this->get('app.notifications')->setOpened($notifications_id, $this->getUser()->getId());

		return new JsonResponse(Array("status"=>"success"));

	}

	/**
	 * Set a notification as read
	 */
	public function setReadAction(){

		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			return new JsonResponse(array('status'=>"error",'errors'=>Array('not_connected')));
		}

		$request = Request::createFromGlobals();

		$notification_id = $request->request->getInt("notification_id",0);

		$this->get('app.notifications')->setViewed($notification_id, $this->getUser()->getId());

		return new JsonResponse(Array("status"=>"success"));

	}

	public function getProfileAction(){

		$request = Request::createFromGlobals();


		$res = Array();
		$nb = 0;


		$from = $request->request->getInt("from");
		$limit = $request->request->getInt("nb");

		$notifications = $this->get('app.notifications')->getAllNotifications(
			$this->getUser(), $from, $limit);


		foreach($notifications as $notification){

			$nb++;

			$data = $notification->getData();

			$data["objecttype"] = $notification->getObjectType();
			$data["isnew"] = !$notification->getViewed();
			$data["isopened"] = $notification->isOpen();
			$data["transport"] = $notification->getTransport();
			$data["id"] = $notification->getId();

			$data["hasImg"] = strlen($notification->getData()["img"])>1;

			$data["date"] = $this->get('app.string_cleaner')->getElapsedTime($notification->getDate());

			$res[] = $data;


		}

		return new JsonResponse(Array("nbresults"=>$nb, "results"=>$res));

	}

}