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

    /** @var TwakeRestClient */
    protected $api = null;

    /** @var String */
    protected $endpoint = null;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->api = $app->getServices()->get("app.restclient");
        $this->endpoint = $this->app->getContainer()->getParameter("defaults.auth.console.provider");
    }
    
    function updateCompany($companyId){

        $details = $this->api->get(rtrim($this->endpoint, "/") . "/companies/" . $companyId);

        error_log("not implemented");
        return [];
    }
    
    function removeCompany($companyId){
        error_log("not implemented");
        return [];
    }
    
    function updateUser($userId, $companyId = null){

        $details = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId);

        /**
         * new "company" is old $group
         * new "guest" are mapped by the boolean $groupUser->getExterne()
         * new "organization_administrator" are mapped by the condition $groupUser->getLevel() === 3
         */

        error_log("not implemented");
        return [];
    }
    
    function addUser($userId, $companyId){
        $details = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId);
        
        //If company not found, we can call updateCompany

        error_log("not implemented");
        return [];
    }
    
    function removeUser($userId, $companyId){
        $details = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId);

        error_log("not implemented");
        return [];
    }

}
