<?php

namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Constraints\Email;
use WebsiteApi\UsersBundle\Entity\Mail;

class AccountController extends Controller
{
	/**
	 * Retrieve user public profile
	 */
	public function profileAction()
	{
		$manager = $this->getDoctrine()->getManager();
		$data = array(
			"data" => Array(),
			"errors" => Array()
		);

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		}
		else {

			$user = $this->getUser();

			$data['data']['firstname'] = $user->getFirstname();
			$data['data']['lastname'] = $user->getLastname();
			$data['data']['gender'] = $user->getGender();
			$data['data']['description'] = $user->getDescription();
			if (preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $user->getBirthdate()) || $user->getBirthdate() == "" || $user->getBirthdate() == null) {
				$data['data']['birthday'] = $user->getBirthdate();
			}
			else {
				$data['data']['birthday'] = "1970-01-01";
			}
			$data['data']['tags'] = Array();
			foreach ($user->getTags($this->get("app.tags")) as $tags) {
				$data['data']['tags'][] = Array("text" => $tags);
			}
			$data['data']['email'] = $user->getEmail();
			$data['data']['secondary_emails'] = Array();
            $data['data']['privacy'] = $this->getUser()->getData()['privacy'];

			foreach ($this->getUser()->getSecondaryMails() as $secondaryEmail) {
				$data['data']['secondaryEmails'][] = Array(
				    'email'=>$secondaryEmail->getMail(),
                    "id"=>$secondaryEmail->getId()
                );
			}

			$data['data']['orgas'] = Array();
			foreach ($this->getUser()->getOrganizations() as $orga){
			    $data['data']['orgas'][] = Array(
			        'name'=>$orga->getName(),
                    'id'=> $orga->getId()
                );
            }
		}

		return new JsonResponse($data);
	}

	/**
	 * update the user public profile
	 */
	public function updateProfileAction(Request $request)
	{
		$data = array(
			"errors" => Array()
		);

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		}
		else {

			$user = $this->getUser();
			$manager = $this->getDoctrine()->getManager();

			$user->setFirstname($request->request->get("firstname"));
			$user->setLastname($request->request->get("lastname"));
			$user->setDescription($request->request->get("description"));
			$user->setTags($this->get("app.tags"), $request->request->get("tags"), 1);
			$user->setPrivacy('firstname', $request->request->get("privacy")["firstname"]);
			$user->setPrivacy('lastname', $request->request->get("privacy")["lastname"]);
			$user->setPrivacy('gender', $request->request->get("privacy")["gender"]);
			$user->setPrivacy('birthday', $request->request->get("privacy")["birthday"]);
			$user->setPrivacy('email', $request->request->get("privacy")["email"]);
			$user->setPrivacy('subscriptions', $request->request->get("privacy")["subscriptions"]);

			if(isset($request->request->get("privacy")["emails"])) {
				foreach ($request->request->get("privacy")["emails"] as $emailId => $privacy) {

					$emailObject = $manager->getRepository("TwakeUsersBundle:Mail")->find($emailId);

					if ($emailObject == null) {
						$data['errors'][] = Array("bademail");
					} else {
						$user->setEmailsPrivacy($emailId, $privacy);
					}
				}
			}
			if(isset($request->request->get("privacy")["orgas"])) {

				foreach ($request->request->get("privacy")["orgas"] as $orgaId => $privacy) {

					$orgaObject = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$orgaId,"isDeleted"=>false));

					if ($orgaObject == null) {
						$data['errors'][] = Array("badorga");
					} else {
						$user->setOrgasPrivacy($orgaId, $privacy);
					}
				}
			}

			if (in_array($request->request->get("gender"), Array("", "M", "F", "A")))
				$user->setGender($request->request->get("gender"));
			else
				$data['errors'][] = "badgender";

			if (preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $request->request->get("birthday")) || $request->request->get("birthday") == "")
				$user->setBirthdate($request->request->get("birthday"));
			else
				$data['errors'][] = "badbirthday";

			$manager->persist($user);
			$manager->flush();
		}

		return new JsonResponse($data);
	}


	public function updateProfileUserImageAction(Request $request){

		$ok = false;
		$errors = Array();
		$data = array(
			"errors" => Array()
		);

		if(!isset($_FILES["file"])) {
			$this->saveThumbnail($ok, $errors, $this->getUser(), null);
		}
		else {
			$res = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["file"], "prfl");

			$data["errors"] = $res[0]["errors"];

			if(isset($res[0]) && isset($res[0]["file"])) {
				$this->saveThumbnail($ok, $errors, $this->getUser(), $res[0]["file"]);
				$data["errors"] = array_merge($data["errors"]);
			}
		}

		return new JsonResponse($data);
	}


	public function updateProfileCoverImageAction(Request $request){

		$ok = false;
		$errors = Array();
		$data = array(
			"errors" => Array()
		);

		if(!isset($_FILES["file"])) {
			$this->saveCover($ok, $errors, $this->getUser(), null);
		}
		else {
			$res = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["file"], "covr");

			$data["errors"] = $res[0]["errors"];

			if(isset($res[0]) && isset($res[0]["file"])) {
				$this->saveCover($ok, $errors, $this->getUser(), $res[0]["file"]);
				$data["errors"] = array_merge($data["errors"]);
			}
		}

		return new JsonResponse($data);
	}


	public function saveThumbnail(&$ok, &$errors, $user, $file) {

		if ($file == null) {
			$currentThumbnail = $user->getThumbnail();
			if ($currentThumbnail != null) {
				$this->getDoctrine()->getManager()->remove($currentThumbnail);
				$currentThumbnail->deleteFromDisk();
				$user->setThumbnail(null);
			}
		}
		else {
			if ($file->getOwner() != $user) {
				$errors[] = 'thumbnail_bad_user';
				$ok = false;
			}
			else if ($file->getType() != 'prfl') {
				$errors[] = 'thumbnail_bad_type';
				$ok = false;
			}
			else {
				$currentThumbnail = $user->getThumbnail();
				if ($currentThumbnail != null) {
					$this->getDoctrine()->getManager()->remove($currentThumbnail);
					$currentThumbnail->deleteFromDisk();
				}

				$user->setThumbnail($file);
				$this->getDoctrine()->getManager()->persist($file);
			}
		}

		$this->getDoctrine()->getManager()->persist($user);
		$this->getDoctrine()->getManager()->flush();

	}

	//OLD ?
	/**
	 * Save différents parts of the profile
	 */
	public function ajaxSaveAction(){

		$manager = $this->getDoctrine()->getManager();
		$user = $this->getUser();

		$errors = array();
		$ok = true;

		$request = Request::createFromGlobals();

		if($request->request->get("content", '')=="identity") {

			$user->setFirstname($request->request->get('firstname', ''));
			$user->setLastname($request->request->get('lastname', ''));
			$user->setGender($request->request->get('gender', ''));
			$user->setDescription($request->request->get('description', ''));
			$user->setBirthdate($request->request->get("birthdate", ''));

			$user->setTags($this->get("app.tags"), $request->request->get("hobbies", ''), 1);

			//Privacy
			$user_data = $user->getData();
			foreach($user_data['privacy'] as $key=>$value){
				if(in_array($request->request->get("privacy_".$key, ''),
					Array("public","private","contacts"))
				){
					$user_data['privacy'][$key] = $request->request->get("privacy_".$key, '');
				}
			}
			$user->setData($user_data);


		}

		if($request->request->get("content", '')=="perso") {

			if($request->request->get("cover_image", '')!='') {
				$this->saveCover($ok, $errors, $user, $request->request->get("cover_image", ''));
			}

			//Privacy
			$user_data = $user->getData();
			foreach($user_data['privacy'] as $key=>$value){
				if(in_array($request->request->get("privacy_".$key, ''),
					Array("public","private","contacts"))
				){
					$user_data['privacy'][$key] = $request->request->get("privacy_".$key, '');
				}
			}
			$user->setData($user_data);

		}

		if($request->request->get("content", '')=="contact") {


			//Privacy
			$user_data = $user->getData();
			foreach($user_data['privacy'] as $key=>$value){
				if(in_array($request->request->get("privacy_".$key, ''),
					Array("public","private","contacts"))
				){
					$user_data['privacy'][$key] = $request->request->get("privacy_".$key, '');
				}
			}
			foreach($this->getUser()->getSecondaryMails() as $secmail){
				if(in_array($request->request->get("privacy_mail_".$secmail->getId(), ''),
					Array("public","private","contacts"))
				){
					$user_data['privacy']["mail_".$secmail->getId()] = $request->request->get("privacy_mail_".$secmail->getId(), '');
				}
			}

			if($request->request->get("phone1", '')!="") {
				$user_data['phone1'] = $request->request->get("phone1", '');
			}
			if($request->request->get("phone2", '')!="") {
				$user_data['phone2'] = $request->request->get("phone2", '');
			}

			$user->setData($user_data);



		}

		if ($ok) {
			$manager->persist($user);
			$manager->flush();
		}

		return new JsonResponse(array(
			'status' => ($ok ? 'success' : 'error'),
			'errors' => $errors
		));

	}




	public function saveCover(&$ok, &$errors, $user, $file) {

		if ($file == null) {
			$currentCover = $user->getCover();
			if ($currentCover != null) {
				$currentCover->deleteFromDisk();
				$this->getDoctrine()->getManager()->remove($currentCover);
				$user->setCover(null);
			}
		} else {
			$fileRepository = $this->getDoctrine()->getRepository("TwakeUploadBundle:File");

			if ($file->getOwner() != $user) {
				$errors[] = 'cover_bad_user';
				$ok = false;
			}
			else if ($file->getType() != 'covr') {
				$errors[] = 'cover_bad_type';
				$ok = false;
			}
			else {
				$currentCover = $user->getCover();
				if ($currentCover != null) {
					$currentCover->deleteFromDisk();
					$this->getDoctrine()->getManager()->remove($currentCover);
				}

				$user->setCover($file);
				$this->getDoctrine()->getManager()->persist($file);

			}
		}
		$this->getDoctrine()->getManager()->persist($user);
		$this->getDoctrine()->getManager()->flush();
	}



}
