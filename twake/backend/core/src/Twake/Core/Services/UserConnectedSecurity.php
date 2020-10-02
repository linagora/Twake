<?php

namespace Twake\Core\Services;

use App\App;
use Common\Http\Request;
use Common\Http\Response;

class UserConnectedSecurity
{

    /** @var App */
    private $app;

    public function __construct(App $app)
    {
        $this->app = $app;
    }

    public function applySecurity(Request $request)
    {
        $user = $this->app->getServices()->get("app.session_handler")->getUser($request);
        if (!$user || is_string($user)) {
            $response = new Response();
            $response->setContent(Array("error" => "user_not_connected"));
            return $response;
        }
        return true;
    }

}