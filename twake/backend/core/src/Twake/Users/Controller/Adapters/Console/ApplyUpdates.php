<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;

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
