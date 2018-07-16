<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UsersAccountController extends Controller
{

	public function setLanguageAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$language = $request->request->get("language", "");
			$this->get("app.user")->updateLanguage($this->getUser()->getId(), $language);

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function getNotificationPreferencesAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$data["data"] = $this->get("app.user")->getNotificationPreferences($this->getUser()->getId());

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function setNotificationPreferencesAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$notification = $request->request->get("preferences", Array());
			$this->get("app.user")->setNotificationPreferences($this->getUser()->getId(), $notification);

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function setIdentityAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$firstname = $request->request->get("firstname", "");
			$lastname = $request->request->get("lastname", "");
            $thumbnail = $request->request->get("thumbnail", null);

			if(isset($_FILES["thumbnail"])) {
				$thumbnail = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["thumbnail"], "prfl");
				$thumbnail = $thumbnail[0];

				if (count($thumbnail["errors"])>0) {
					$data["errors"][] = "badimage";
				} else {
					$this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname, $thumbnail["file"]);
				}
			}else{
                $this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname, $thumbnail);
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function setUsernameAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$username = $request->request->get("username", "");

			if(!$this->get("app.user")->changePseudo($this->getUser()->getId(), $username)){
				$data["errors"][] = "alreadyused";
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function setPasswordAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$oldPassword = $request->request->get("old_password", "");
			$password = $request->request->get("password", "");

			if(!$this->get("app.user")->changePassword($this->getUser()->getId(), $oldPassword, $password)){
				$data["errors"][] = "badpassword";
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function setMainMailAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$mail = $request->request->get("mail", "");

			if(!$this->get("app.user")->changeMainMail($this->getUser()->getId(), $mail)){
				$data["errors"][] = "nosuchid";
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function removeMailAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$mail = $request->request->get("mail", "");

			if(!$this->get("app.user")->removeSecondaryMail($this->getUser()->getId(), $mail)){
				$data["errors"][] = "badmail";
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function addMailAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$mail = $request->request->get("mail", "");

			$token = $this->get("app.user")->addNewMail($this->getUser()->getId(), $mail);

			if($token) {
				$data["data"]["token"] = $token;
			}else{
				$data["errors"][] = "badmail";
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function addMailVerifyAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$token = $request->request->get("token", "");
			$number = $request->request->get("code", "");

			$ok = $this->get("app.user")->checkNumberForAddNewMail($this->getUser()->getId(), $token, $number);

			if($ok) {
				$data["data"]["status"] = "success";
			}else{
				$data["errors"][] = "badcode";
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

	public function getMailsAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if($this->getUser()){

			$mails = $this->get("app.user")->getSecondaryMails($this->getUser());

			$data["data"][] = Array(
				"id" => -1,
				"main" => true,
				"email" => $this->getUser()->getEmail()
			);
			foreach ($mails as $mail){
				$data["data"][] = Array(
					"id" => $mail->getId(),
					"main" => false,
					"email" => $mail->getMail()
				);
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

}