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

    /** @var String */
    private $authB64 = "";

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->api = $app->getServices()->get("app.restclient");
        $this->endpoint = $this->app->getContainer()->getParameter("defaults.auth.console.provider");
        $this->authB64 = base64_encode(
            $this->app->getContainer()->getParameter("defaults.auth.console.credentials.key")
            .  ":"
            . $this->app->getContainer()->getParameter("defaults.auth.console.credentials.secret"));
    }
    
    function updateCompany($companyCode){
        error_log("updateCompany with params: " . json_encode([$companyCode]));
        $header = "Authorization: Basic " . $this->authB64;
        $response = $this->api->get(rtrim($this->endpoint, "/") . "/companies/" . $companyCode, array(CURLOPT_HTTPHEADER => [$header]));
        $companyDTO = json_decode($response->getContent(), 1);
        $result = (new ApplyUpdates($this->app))->updateCompany($companyDTO);
        return [
            "success" => !!$result
        ];
    }
    
    function removeCompany($companyCode){
        error_log("removeCompany with params: " . json_encode([$companyCode]));
        $result = (new ApplyUpdates($this->app))->removeCompany($companyCode);
        return [
            "success" => !!$result
        ];
    }
    
    function updateUser($userId, $companyCode = null, $userDTO = null){
        error_log("updateUser with params: " . json_encode([$userId, $companyCode, $userDTO]));
        //$header = "Authorization: Basic " . $this->authB64;
        //$response = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId, array(CURLOPT_HTTPHEADER => [$header]));
        //$userDTO = json_decode($response->getContent(), 1);
        if(!$userDTO){
            return [
                "success" => false
            ];
        }
        $result = (new ApplyUpdates($this->app))->updateUser($userDTO);
        return [
            "success" => !!$result
        ];
    }
    
    function addUser($userId, $companyCode, $userDTO = null){
        error_log("addUser with params: " . json_encode([$userId, $companyCode, $userDTO]));

        $user = (new Utils($this->app))->getUser($userId);
        $company = (new Utils($this->app))->getCompany($companyCode);

        if(!$user){
            $this->updateUser($userId, $companyCode, $userDTO);
            $user = (new Utils($this->app))->getUser($userId);
        }
        if(!$company){
            $this->updateCompany($companyCode);
            $company = (new Utils($this->app))->getCompany($companyCode);
        }

        if(!$user || !$company){
            return [
                "success" => false
            ]; 
        }

        //Fixme, in the future there should be a better endpoint to get user role in a given company
        if(!$userDTO){
            $header = "Authorization: Basic " . $this->authB64;
            $response = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId, array(CURLOPT_HTTPHEADER => [$header]));
            $userDTO = json_decode($response->getContent(), 1);
        }
        $companyRole = null;
        foreach($userDTO["roles"] as $role){
            if($role["targetCode"] === $companyCode){
                $companyRole = $role;
            }
        }
        $result = (new ApplyUpdates($this->app))->addUser($user, $company, $companyRole);
        return [
            "success" => !!$result
        ];
    }
    
    function removeUser($userId, $companyCode){
        error_log("removeUser with params: " . json_encode([$userId, $companyCode]));

        $user = (new Utils($this->app))->getUser($userId);
        $company = (new Utils($this->app))->getCompany($companyCode);

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
