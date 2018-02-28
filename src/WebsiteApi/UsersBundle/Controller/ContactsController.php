<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class ContactsController extends Controller
{

	public function addAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
			$user_id = $request->request->getInt("user_id", 0);
			$res = $this->get("app.contacts")->ask($this->getUser(), $user_id);
			if($res){
				$data["data"] = "success";
			}
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function removeAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
			$user_id = $request->request->getInt("user_id", 0);
			$res = $this->get("app.contacts")->remove($this->getUser(), $user_id);
			if($res){
				$data["data"] = "success";
			}
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function getAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
			$user_id = $request->request->getInt("user_id", 0);
			$res = $this->get("app.contacts")->get($this->getUser(), $user_id);
			if($res){
				$data["data"] = $res->getStatus();
			}
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function getAllAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
			$res = $this->get("app.contacts")->getAll($this->getUser());
			$list = [];
			foreach($res as $user){
				$list[] = $user->getAsArray();
			}
			$data["data"] = $list;
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function getAllRequestsAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
			$res = $this->get("app.contacts")->getAllRequests($this->getUser());
			$list = [];
			foreach($res as $user){
				$list[] = $user->getAsArray();
			}
			$data["data"] = $list;
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function getAllRequestsFromMeAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
			$res = $this->get("app.contacts")->getAllRequestsFromMe($this->getUser());
			$list = [];
			foreach($res as $user){
				$list[] = $user->getAsArray();
			}
			$data["data"] = $list;
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function searchByUsernameAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){
			$username = $request->request->get("username", "");
			$res = $this->get("app.contacts")->searchByUsername($this->getUser(), $username);
			if($res){
				$data["data"] = $res->getAsArray();
			}
		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

}