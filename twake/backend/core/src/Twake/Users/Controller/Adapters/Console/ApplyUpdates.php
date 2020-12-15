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
        error_log("not implemented");
        return [];
    }
    
    function removeCompany($companyId){
        error_log("not implemented");
        return [];
    }
    
    function updateUser($userId, $companyId = null){
        /**
         * new "company" is old $group
         * new "guest" are mapped by the boolean $groupUser->getExterne()
         * new "organization_administrator" are mapped by the condition $groupUser->getLevel() === 3
         */

        error_log("not implemented");
        return [];
    }
    
    function addUser($userId, $companyId){
        error_log("not implemented");
        return [];
    }
    
    function removeUser($userId, $companyId){
        error_log("not implemented");
        return [];
    }

}
