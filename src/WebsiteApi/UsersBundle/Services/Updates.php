<?php

namespace WebsiteApi\UsersBundle\Services;

use WebsiteApi\UsersBundle\Entity\Contact;
use WebsiteApi\UsersBundle\Model\ContactsInterface;

class Updates
{

    /* Used for websocket init */
    public function init($route, $data, $user)
    {
        return true;
    }

}