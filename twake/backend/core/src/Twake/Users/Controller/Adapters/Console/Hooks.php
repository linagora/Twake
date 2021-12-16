<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;
use Common\Http\Response;
use Common\Http\Request;

class Hooks
{
    /** @var App */
    protected $app = null;

    public function __construct(App $app)
    {
        $this->app = $app;
    }
    
    function handle(Request $request)
    {
        $sign = $request->request->get("signature");
        $event = [
            "content" => $request->request->get("content"),
            "type" => $request->request->get("type"),
            "secret_key" => $request->request->get("secret_key")
        ];

        // Check secret
        $secret = $this->app->getContainer()->getParameter("defaults.auth.console.secret");
        if ($secret && $secret != $request->query->get("secret_key")) {
            return new Response(["error" => "unauthorized"], 401);
        }

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

        error_log(json_encode($event));

        switch($event["type"]){
            case "company_user_added":
            case "company_user_activated":
            case "company_user_updated":
                    return $this->userAdded($event["content"]);
            case "company_user_deactivated":
                return $this->userRemoved($event["content"]);
            case "user_updated":
                return $this->userUpdated($event["content"]);
            case "plan_updated":
                return $this->planUpdated($event["content"]);
            case "company_deleted":
                return $this->companyRemoved($event["content"]);
            case "company_created":
            case "company_updated":
                return $this->companyUpdated($event["content"]);
            default:
                return new Response(["error" => "unimplemented"], 501);
        }
    }

    function userAdded($data){
        $service = new PrepareUpdates($this->app);
        if($data["company"]["code"]) $service->updateCompany($data["company"]["code"]);
        return new Response($service->addUser($data["user"]["_id"], $data["company"]["code"] ?: null, $data["user"]) ?: "");
    }

    function userRemoved($data){
        $service = new PrepareUpdates($this->app);
        if($data["company"]["code"]) $service->updateCompany($data["company"]["code"]);
        return new Response($service->removeUser($data["user"]["_id"], $data["company"]["code"] ?: null) ?: "");
    }
    
    function userUpdated($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->updateUser($data["user"]["_id"], $data["company"]["code"] ?: null, $data["user"]) ?: "");
    }
        
    function companyRemoved($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->removeCompany($data["company"]["code"]) ?: "");
    }
    
    function companyUpdated($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->updateCompany($data["company"]["code"]) ?: "");
    }
    
    function planUpdated($data){
        $service = new PrepareUpdates($this->app);
        return new Response($service->updateCompany($data["company"]["code"]) ?: "");
    }

}
