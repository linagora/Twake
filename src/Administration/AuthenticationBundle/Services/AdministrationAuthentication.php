<?php


namespace Administration\AuthenticationBundle\Services;

use Administration\AuthenticationBundle\Entity\AdminUser;
use Administration\AuthenticationBundle\Model\AdministrationAuthenticationInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints\DateTime;

class AdministrationAuthentication implements AdministrationAuthenticationInterface
{

    /**
     * AdministrationAuthentication constructor.
     */
    public function __construct($doctrine, $password_factory)
    {
        $this->doctrine = $doctrine;
	    $this->password_factory = $password_factory;
    }

    public function authenticate($username, $password)
    {
        $em = $this->doctrine;
	    $adminUserRepo  = $em->getRepository("AdministrationAuthenticationBundle:AdminUser"); //Entity Repository
        $repo  = $em->getRepository("TwakeUsersBundle:User"); //Entity Repository

	    $twakeUser = $repo->findOneBy(Array("username"=>$username));
	    if($twakeUser == null){
			return null;
	    }

	    $adminUser = $adminUserRepo->findOneBy(Array("user"=>$twakeUser));
	    if($adminUser == null){
		    return null;
	    }

		$factory = $this->password_factory;
        if($factory->getEncoder($twakeUser)
	        ->isPasswordValid($twakeUser->getPassword(), $password, $twakeUser->getSalt())
        ){
	        $adminUser->newAccessToken();
            $em->persist($adminUser); //commit
            $em->flush(); //push
            return $adminUser->getAccessToken();
        }
        return null;

    }


    public function verifyUserConnectionByHttpRequest(Request $request)
    {
        $header = $request->headers->get('Authorization');

        $arrayHeader = explode(" ", $header);
        $tokenNumber = array_pop($arrayHeader);
        $tokenName = array_pop($arrayHeader);
        if($tokenName != "Token"){
            //return null;
        }

	    $em = $this->doctrine;
        $repo  = $em->getRepository("AdministrationAuthenticationBundle:AdminUser");

        $user = $repo->findOneBy(Array("accessToken"=>$tokenNumber));
        if($user == null){
	        return null;
        }

	    $userDate = $user->getDateReset();

        if(((new \DateTime("now"))->getTimestamp()-$userDate->getTimestamp())<10000000000/*60*/){

	        $user->setDateReset(new \DateTime("now"));
	        $em->persist($user); //commit
	        $em->flush(); //push

            return $user;
        }
        return null;

    }


}
