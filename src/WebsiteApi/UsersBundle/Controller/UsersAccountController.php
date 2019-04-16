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

        if ($this->getUser()) {

            $notification = $request->request->get("preferences", Array());
            $this->get("app.user")->setNotificationPreferences($this->getUser()->getId(), $notification);

        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function setTutorialStatusAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {

            $status = $request->request->get("status", Array());
            $this->get("app.user")->setTutorialStatus($this->getUser()->getId(), $status);

        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

	public function updateNotificationPreferenceByWorkspaceAction(Request $request){
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId", 0);
        $appNotif = $request->request->get("appNotification", Array());

        $res = $this->get("app.user")->updateNotificationPreferenceByWorkspace($workspaceId,$appNotif,$this->getUser());

        if($res){
            $data["data"] = "success";
        }else{
            $data["error"][]  = "error";
        }

        return new JsonResponse($data);
    }

    public function setWorkspacesPreferencesAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {

            $preferences = $request->request->get("preferences", Array());
            $this->get("app.user")->setWorkspacesPreferences($this->getUser()->getId(), $preferences);

        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function updateStatusAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser()) {

            $status = $request->request->get("status", Array());
            $this->get("app.user")->updateStatus($this->getUser()->getId(), $status);

        } else {
            $data["errors"][] = "unknown";
        }

        return new JsonResponse($data);

    }

    public function getUploader()
    {
        $aws = $this->getParameter('aws');
        if (isset($aws["S3"]["use"]) && $aws["S3"]["use"]) {
            return $this->get("app.aws_uploader");
        }
        $openstack = $this->getParameter('openstack');
        if (isset($openstack["use"]) && $openstack["use"]) {
            return $this->get("app.openstack_uploader");
        }
        return $this->get("app.uploader");
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
                $thumbnail = $this->getUploader()->uploadFiles($this->getUser(), $_FILES["thumbnail"], "prfl");
				$thumbnail = $thumbnail[0];

				if (count($thumbnail["errors"])>0) {
					$data["errors"][] = "badimage";
				} else {
                    $this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname, $thumbnail["file"], $this->getUploader());
                    $data["data"]["thumbnail"] = $this->getUser()->getThumbnail()!=null?$this->getUser()->getThumbnail()->getPublicURL(2):"";
				}
			}else{
                $this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname, $thumbnail, $this->getUploader());
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
            $result = $this->get("app.user")->removeSecondaryMail($this->getUser()->getId(), $mail);
			if(!$result){
				$data["errors"][] = "badmail";
			}
			$data["statuts"] = $result;

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

			$idMail = $this->get("app.user")->checkNumberForAddNewMail($this->getUser()->getId(), $token, $number);

			if($idMail) {
				$data["data"]["status"] = "success";
                $data["data"]["idMail"] = $idMail;

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
			foreach ($mails as $mail){
				$data["data"][] = Array(
					"id" => $mail->getId(),
					"main" => $mail->getMail()==$this->getUser()->getEmail(),
					"email" => $mail->getMail()
				);
			}

		}else{
			$data["errors"][] = "unknown";
		}

		return new JsonResponse($data);

	}

}