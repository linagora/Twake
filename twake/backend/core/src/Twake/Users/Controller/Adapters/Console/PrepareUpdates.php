<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;

/**
 * This class will do updates in Twake from Twake console
 */
class PrepareUpdates
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
        $companyDTO = $this->api->get(rtrim($this->endpoint, "/") . "/companies/" . $companyId);
        $result = (new ApplyUpdates())->updateCompany($companyDTO);
        return [
            "success" => !!$result
        ];
    }
    
    function removeCompany($companyId){
        $result = (new ApplyUpdates())->removeCompany($companyId);
        return [
            "success" => !!$result
        ];
    }
    
    function updateUser($userId, $companyId = null){
        $userDTO = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId);
        $result = (new ApplyUpdates())->updateCompany($userDTO);
        return [
            "success" => !!$result
        ];
    }
    
    function addUser($userId, $companyId){

        $user = (new Utils())->getUser($userId);
        $company = (new Utils())->getCompany($companyId);

        if(!$user){
            $this->updateUser($userId);
            $user = (new Utils())->getUser($userId);
        }
        if(!$company){
            $this->updateCompany($companyId);
            $company = (new Utils())->getCompany($companyId);
        }

        if(!$user || !$company){
            return [
                "success" => false
            ]; 
        }

        //Fixme, in the future there should be a better endpoint to get user role in a given company
        $userDTO = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId);
        $companyRole = null;
        foreach($userDTO["roles"] as $role){
            if($role["company"]["_id"] === $companyId){
                $companyRole = $role;
            }
        }
        
        $result = (new ApplyUpdates())->addUser($user, $company, $companyRole);
        return [
            "success" => !!$result
        ];
    }
    
    function removeUser($userId, $companyId){

        $user = (new Utils())->getUser($userId);
        $company = (new Utils())->getCompany($companyId);

        if(!$user || !$company){
            return [
                "success" => true
            ]; 
        }

        $result = (new ApplyUpdates())->removeUser($user, $company);
        return [
            "success" => !!$result
        ];
    }

}
