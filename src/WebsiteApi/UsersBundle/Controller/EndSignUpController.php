<?php

namespace WebsiteApi\UsersBundle\Controller;

use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;

class EndSignUpController extends Controller
{

	/**
	 * Final inscription part, after mail confirmation
	 *
	 * ### Response ###
	 *
	 * {
	 *   "errors": []
	 *   "status": "success"/"error"
	 * }
	 *
	 * ### Errors ###
	 *
	 * nosuchtoken
	 * invalidusername
	 * invalidpassword
	 * badverify
	 * username_already_used
	 *
	 *
	 *
	 * @ApiDoc(
	 *  parameters = {
	 *      {"name"="username", "dataType"="string", "required"=true, "description"="Username"},
	 *      {"name"="password", "dataType"="string", "required"=true, "description"="Password"},
	 *      {"name"="verify", "dataType"="string", "required"=true, "description"="Password verify"},
	 *      {"name"="token", "dataType"="string", "required"=true, "description"="Token given by e-mail"}
	 *  },
	 *
	 *  views = { "ajax" },
	 *  section = "Registration"
	 * )
	 */
    public function validateAction(Request $request)
    {

        $username = $request->request->get('username');
        $password = $request->request->get('password');
	    $verify = $request->request->get('verify');
	    $token = $request->request->get('token');

        return $this->validate($username, $password, $verify, $token, $request);

    }


    public function validate($username, $password, $verify, $token, $request)
    {

	    $userManager = $this->get('fos_user.user_manager');
	    $newUser = $userManager->findUserByConfirmationToken($token);

	    $ok = true;
	    $errors = Array();


	    if($newUser == null){
		    $errors[] = "nosuchtoken";
		    $ok = false;
	    }

	    if($ok) {

		    //Verifications des champs
		    if (!$this->get('app.string_cleaner')->verifyUsername($username)) {
			    $ok = false;
			    $errors[] = 'invalidusername';
		    }

		    if (!$this->get('app.string_cleaner')->verifyPassword($password)) {
			    $ok = false;
			    $errors[] = 'invalidpassword';
		    } else if ($password != $verify) {
			    $ok = false;
			    $errors[] = 'badverify';
		    }

		    $repository = $this->getDoctrine()->getManager()->getRepository('TwakeUsersBundle:User');

		    $cleanUsername = $this->get('app.string_cleaner')->simplify($username);
		    $user = $repository->findOneBy(array('username_clean' => $cleanUsername));

		    if ($user != null && $user->getEmail() != $newUser->getEmail()) {
			    $ok = false;
			    $errors[] = 'username_already_used';
		    }
	    }


	    $response = new JSonResponse(array('status' => ($ok)?'success':"error", "errors"=>$errors));

	    if($ok) {

		    $factory = $this->get('security.encoder_factory');
		    $encoder = $factory->getEncoder($newUser);
		    $newUser->setUsername($username);
		    $newUser->setUsernameClean($this->get('app.string_cleaner')->simplify($username));
		    $newUser->setPassword($encoder->encodePassword($password, $newUser->getSalt()));
		    $newUser->signupDone();


		    //If everything is ok, validate the user and desactivate the confirmation token :
		    $newUser->setConfirmationToken(null);
		    $newUser->setEnabled(true);


		    //Update database
		    $em = $this->getDoctrine()->getManager();
		    $em->persist($newUser);
		    $em->flush();

		    //Update contacts request may be asked via mail
		    $this->get('app.contacts')->checkRequestAskedByMail($newUser, $newUser->getEmail());
		    $this->get('app.contacts')->checkGroupRequestAskedByMail($newUser, $newUser->getEmail());


		    //Login
		    $token = new UsernamePasswordToken($newUser, null, "main", $newUser->getRoles());
		    $this->get('app.core_remember_me_manager')->doRemember($request, $response, $token);
		    $this->get("security.token_storage")->setToken($token);
			$request = $this->get('request_stack')->getCurrentRequest();
		    $event = new InteractiveLoginEvent($request, $token);
		    $this->get("event_dispatcher")->dispatch("security.interactive_login", $event);

	    }

        return $response;
    }
}
