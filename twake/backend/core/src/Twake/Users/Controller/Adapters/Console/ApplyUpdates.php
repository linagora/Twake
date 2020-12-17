<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;

/**
 * This class will do updates in Twake from Twake console
 */
class ApplyUpdates
{
    /** @var App */
    protected $app = null;

    public function __construct(App $app)
    {
        $this->app = $app;
    }
    
    function updateCompany($companyId){
    }
    
    function removeCompany($companyId){
    }
    
    /**
     * Take a user from api and save it into PHP
     */
    function updateUser($userDTO){
        $external_id = $userDTO["_id"];
        $email = $userDTO["email"];
        $picture = $userDTO["picture"];
        $fullname = $userDTO["firstName"] . " " . $userDTO["lastName"];
        $username = preg_replace("/ +/", "_",
            preg_replace("/[^a-zA-Z0-9]/", "",
                trim(
                    strtolower(
                        $fullname ?: explode("@", $userDTO["email"])[0]
                    )
                )
            )
        );
    }
    
    function addUser($userId, $companyId){
    }
    
    function removeUser($userId, $companyId){
    }

}
