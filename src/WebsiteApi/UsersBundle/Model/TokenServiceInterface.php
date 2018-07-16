<?php

namespace WebsiteApi\UsersBundle\Model;

use WebsiteApi\UsersBundle\Entity\Token;

/**
 * This is an interface for the service TokenService
 */
interface TokenServiceInterface
{
    public function refreshToken(Token $userToken);
}