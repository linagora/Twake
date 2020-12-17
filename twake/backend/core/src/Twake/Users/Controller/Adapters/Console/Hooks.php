<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;
use Common\Http\Response;

class Hooks
{
    /** @var App */
    protected $app = null;

    public function __construct(App $app)
    {
        $this->app = $app;
    }
    
    function handle(Request $request, App $app)
    {
        $sign = $request->request->get("signature");
        $event = $request->request->get("event");

        // Check signature to ensure request origin
        $publicKey = $this->app->getContainer()->getParameter("defaults.auth.console.public_key");
        if ($publicKey) {
            $r = openssl_verify(json_encode($event), base64_decode(str_replace(str_split('._-'), str_split('+/='), $sign)), $publicKey, OPENSSL_ALGO_SHA512);
            if(!$r){
                return new Response(["error" => "unauthorized"], 401);
            }
        }else{
            error_log("WARNING: no public key set for console hook!");
        }

        switch($event["type"]){
            case "user_added":
                return $this->userAdded($event["content"]);
            case "user_removed":
                return $this->userRemoved($event["content"]);
            case "user_updated":
                return $this->userUpdated($event["content"]);
            case "plan_updated":
                return $this->planUpdated($event["content"]);
            case "company_removed":
                return $this->companyRemoved($event["content"]);
            case "company_updated":
                return $this->companyUpdated($event["content"]);
            default:
                return new Response(["error" => "unimplemented"], 501);
        }
    }

    function userAdded($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->addUser($data["user_id"], $data["company_id"] ?: null) ?: "");
    }

    function userRemoved($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->removeUser($data["user_id"], $data["company_id"] ?: null) ?: "");
    }
    
    function userUpdated($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->updateUser($data["user_id"], $data["company_id"] ?: null) ?: "");
    }
        
    function companyRemoved($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->removeCompany($data["company_id"]) ?: "");
    }
    
    function companyUpdated($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->updateCompany($data["company_id"]) ?: "");
    }
    
    function planUpdated($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->updateCompany($data["company_id"]) ?: "");
    }

}
