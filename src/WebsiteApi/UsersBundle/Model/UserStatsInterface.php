<?php

namespace WebsiteApi\UsersBundle\Model;

/**
 * This is an interface for the service UserStats
 *
 * This service is responsible for recording data from user for statistical purpose only
 */
interface UserStatsInterface
{

    // @login when an user log in
    public function create($user);

    // @sendMessage when an user send a message
    public function sendMessage($user, $private = true);

}