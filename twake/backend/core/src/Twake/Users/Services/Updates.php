<?php

namespace Twake\Users\Services;

use Twake\Users\Model\ContactsInterface;
use App\App;

class Updates
{

    /* Used for websocket init */
    public function init($route, $data, $user)
    {
        return true;
    }

}