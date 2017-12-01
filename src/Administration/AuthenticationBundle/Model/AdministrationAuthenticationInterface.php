<?php

namespace Administration\AuthenticationBundle\Model;

use Symfony\Component\HttpFoundation\Request;

//TODO : - replace current arguments by service arguments (no $request)
//       - reduce the number of function if possible
//       - add comments

/**
 * This is an interface for the service AdministrationAuthentication
 *
 * This service is responsible of all s regarding the administrationPannel it should be used everytime
 */
interface AdministrationAuthenticationInterface
{
    // @authenticate returns the token to the adminUser
    public function authenticate($user, $password);
    // @verifyUserConnectionByHttpRequest returns the user's role if he's connected else none
    public function verifyUserConnectionByHttpRequest(Request $request);
}