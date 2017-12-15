<?php

namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class UserController extends Controller
{
    public function indexAction(Request $request)
    {
        $reponse = Array(
            "errors" => [],
            "data" => []
        );
        $repository = $this->getDoctrine()->getManager()->getRepository('TwakeUsersBundle:User');
        $username = $request->request->get('username');
        $users = $repository->findBy(array('username_clean' => $username));
	    $manager = $this->getDoctrine()->getManager();

        if (!empty($users)) {

	        $user = $users[0];
        	$areContacts = true;

	        $contactLink = $manager->getRepository('TwakeUsersBundle:Contact')->findOneBy(Array("userA" => $this->getUser(), "userB" => $user));
	        if ($contactLink == null) {
		        $contactLink = $manager->getRepository('TwakeUsersBundle:Contact')->findOneBy(Array("userA" => $user, "userB" => $this->getUser()));
		        if ($contactLink == null) {
			        $areContacts = false;
		        }
	        }


	        // Infos de base
	        $retour = Array();
	        $retour["idUser"] = $user->getId();
	        $retour["username"] = $user->getUsername();
	        $retour["susername"] = $user->getUsernameClean();
	        $retour["description"] = $user->getDescription();
	        $retour["profil"] = $user->getCssProfileImage();
	        $retour["cover"] = $user->getCssCoverImage();

        	if ($user->getPrivacy("firstname") == "public" || ($user->getPrivacy("firstname") == "contacts" && $areContacts)) {
		        $retour["firstname"] = $user->getFirstname();
	        }
	        if ($user->getPrivacy("lastname") == "public" || ($user->getPrivacy("lastname") == "contacts" && $areContacts)) {
		        $retour["lastname"] = $user->getLastname();
	        }
	        if ($user->getPrivacy("email") == "public" || ($user->getPrivacy("email") == "contacts" && $areContacts)) {
		        $retour["mail"] = $user->getEmail();
	        }
	        if ($user->getPrivacy("phone1") == "public" || ($user->getPrivacy("phone1") == "contacts" && $areContacts)) {
		        $retour["phone1"] = $user->getData()["phone1"];
	        }
	        if ($user->getPrivacy("phone2") == "public" || ($user->getPrivacy("phone2") == "contacts" && $areContacts)) {
		        $retour["phone2"] = $user->getData()["phone2"];
	        }
	        if ($user->getPrivacy("gender") == "public" || ($user->getPrivacy("gender") == "contacts" && $areContacts)) {
		        $retour["gender"] = $user->getGender();
	        }
	        if ($user->getPrivacy("birthday") == "public" || ($user->getPrivacy("birthday") == "contacts" && $areContacts)) {
		        $retour["birthday"] = $user->getBirthdate();
	        }

	        // Emails secondaires
	        $retour["secondaryMails"] = Array();
        	$secondaryMails = $user->getSecondaryMails();

        	foreach ($secondaryMails as $mail) {
        		if ($user->getEmailPrivacy($mail->getMail()) == "public" || ($user->getEmailPrivacy($mail->getMail()) == "contacts" && $areContacts)) {
			        $retour["secondaryMails"][] = $mail->getMail();
		        }
	        }

	        // Groupes
	        $retour["groups"] = Array();
	        $workspaces = $user->getWorkspaces();

	        foreach ($workspaces as $workspace) {
		        if ($user->getWorkspacePrivacy($workspace->getId()) == "public" || ($user->getWorkspacePrivacy($workspace->getId()) == "contacts" && $areContacts)) {
			        $retour["groups"][] = Array(
				        "id" => $workspace->getId(),
				        "name" => $workspace->getName(),
				        "description" => $workspace->getDescription()
			        );
		        }
	        }

	        // Contacts
	        $retour["contacts"] = Array();
	        $contactsA = $manager->getRepository('TwakeUsersBundle:Contact')->findBy(Array("userA" => $user, "status" => 'A'));
	        $contactsB = $manager->getRepository('TwakeUsersBundle:Contact')->findBy(Array("userB" => $user, "status" => 'A'));

	        foreach ((array)$contactsA as $contact) {
		        $retour["contacts"][] = Array(
			        "id" => $contact->getUserB()->getId(),
			        "username" => $contact->getUserB()->getUsername(),
			        "cssuserimage" => $contact->getUserB()->getCssProfileImage()
		        );
	        }
	        foreach ((array)$contactsB as $contact) {
		        $retour["contacts"][] = Array(
			        "id" => $contact->getUserA()->getId(),
			        "username" => $contact->getUserA()->getUsername(),
			        "cssuserimage" => $contact->getUserA()->getCssProfileImage()
		        );
	        }

            $reponse["data"] = $retour;

        }
        else {
            $reponse["errors"][] = "userNotFound";
        }
        return new JsonResponse($reponse);

    }

    public function fastSearchAction(Request $request){
        $data = Array(
            "errors" => [],
            "data" => []
        );
        $limit = $request->request->getInt("limit");
        $model = $request->request->get("model");
        $manager = $this->getDoctrine()->getManager();

        $users = $manager->getRepository('TwakeUsersBundle:User')->createQueryBuilder('u')
            ->where('u.username LIKE :model')
            ->setParameter('model','%'.$model.'%')
            ->getQuery()
            ->getResult();
        $compte = 0;
        foreach($users as $user){
            if($compte>=$limit){
                break;
            }
            $data['data'][] = Array(
                    "id" => $user->getId(),
                    "username" => $user->getUsername(),
                    "cssuserimage" =>  $user->getCssProfileImage()
                );

            $compte++;
        }
        return new JsonResponse($data);
    }


}
