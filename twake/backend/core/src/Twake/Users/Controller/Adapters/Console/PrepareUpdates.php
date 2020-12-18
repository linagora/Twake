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
        $response = $this->api->get(rtrim($this->endpoint, "/") . "/companies/" . $companyId);
        $companyDTO = json_decode($response->getContent(), 1);
        $result = (new ApplyUpdates($this->app))->updateCompany($companyDTO);
        return [
            "success" => !!$result
        ];
    }
    
    function removeCompany($companyId){
        $result = (new ApplyUpdates($this->app))->removeCompany($companyId);
        return [
            "success" => !!$result
        ];
    }
    
    function updateUser($userId, $companyId = null){
        $response = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId);
        $userDTO = json_decode($response->getContent(), 1);
        $result = (new ApplyUpdates($this->app))->updateCompany($userDTO);
        return [
            "success" => !!$result
        ];
    }
    
    function addUser($userId, $companyId, $userDTO = null){

        $user = (new Utils($this->app))->getUser($userId);
        $company = (new Utils($this->app))->getCompany($companyId);

        if(!$user){
            $this->updateUser($userId);
            $user = (new Utils($this->app))->getUser($userId);
        }
        if(!$company){
            $this->updateCompany($companyId);
            $company = (new Utils($this->app))->getCompany($companyId);
        }

        if(!$user || !$company){
            return [
                "success" => false
            ]; 
        }

        //Fixme, in the future there should be a better endpoint to get user role in a given company
        if(!$userDTO){
            $response = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId);
            $userDTO = json_decode($response->getContent(), 1);
        }
        $companyRole = null;
        foreach($userDTO["roles"] as $role){
            if($role["company"]["_id"] === $companyId){
                $companyRole = $role;
            }
        }
        $result = (new ApplyUpdates($this->app))->addUser($user, $company, $companyRole);
        return [
            "success" => !!$result
        ];
    }
    
    function removeUser($userId, $companyId){

        $user = (new Utils($this->app))->getUser($userId);
        $company = (new Utils($this->app))->getCompany($companyId);

        if(!$user || !$company){
            return [
                "success" => true
            ]; 
        }

        $result = (new ApplyUpdates($this->app))->removeUser($user, $company);
        return [
            "success" => !!$result
        ];
    }

}
