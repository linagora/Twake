<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class ZZZUserDeleteTest extends WebTestCaseExtended
{
    public function testIndex()
    {

	    //Just remove the user (not the dependancies)
	    $repo = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
	    $user = $repo->findOneBy(Array("email"=>"UnitTest@citigo.fr"));

	    if($user==null){

		    $this->assertNotNull($user, "Aucun utilisateur de test à supprimer !");

	    }else {

		    $this->getDoctrine()->remove($user);

		    //TODO : remove messages / files / groups links / groups only associated to this user...

		    $this->getDoctrine()->flush();

	    }

    }
}
