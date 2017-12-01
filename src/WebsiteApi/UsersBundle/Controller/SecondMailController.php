<?php

namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class SecondMailController extends Controller
{
	/**
	 * Verify mail and display that its ok
	 * or show form allowing user to log in
	 */
	public function verifyAction(Request $request)
    {

		$manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');
        $response = Array(
            "status" => "success",
	        "detail" => "",
            "errors" => [],
            "data" => []
        );

	    $token = $request->get("token");

	    //Get the mail
	    $repository = $manager->getRepository("TwakeUsersBundle:Mail");
	    $smail = $repository->findOneBy(Array("token"=>$token));

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

	        if($smail==null){
		        //Ce mail n'existe pas !
		        $response["detail"] = "emailNotFound";
		        $response["status"] = "error";
	        }else {
		        $response['status'] = "error";
		        $response["detail"] = "notconnected";
		        $response["data"] = Array(
			        "email"=>$smail->getMail()
		        );
	        }
            return new JsonResponse($response);
        }
		$user = $this->getUser();



		if($smail==null){
			//Ce mail n'existe pas !
			$response["detail"] = "emailNotFound";
			$response["status"] = "error";
		} else {

            // On verifie si l'email est attribué a un utilisateur précis, sinon on doit avoir confirmation pour prendre la main
            if($smail->getUser()==null){

                if($request->request->getInt("confirmed",0)==1){
                    $smail->setUser($user);
                    $smail->setToken(null);
                    $manager->persist($smail);
                    $manager->flush();
                    $response["data"] = Array(
                        "email"=>$smail->getMail()
                    );
                } else {
                    $response["status"] =  "error";
                    $response["detail"] = "mustconfirm";
                }
            } else {
                if($smail->getUser()->getId() == $user->getId()){
                    //Everything is ok

                    //Proceed
                    $smail->setToken(null);
                    $manager->persist($smail);
                    $manager->flush();

                    //Update contacts request may be asked via mail
                    $this->get('app.contacts')->checkRequestAskedByMail($this->getUser(), $smail->getMail());
                    $this->get('app.contacts')->checkGroupRequestAskedByMail($this->getUser(), $smail->getMail());

                    $response["data"] = Array(
                                        "email"=>$smail->getMail()
                    );
                } else {
                    //User and mail mismatch
                    $response["detail"] = "userAndMailMismatch";
                    $response["status"] = "error";
                }
            }

		}
        return new JsonResponse($response);
	}

}
