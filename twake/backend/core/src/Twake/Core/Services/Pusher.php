<?php


namespace Twake\Core\Services;

use App\App;

class Pusher
{

    var $pusher;
    var $secret;
    var $rest;

    public function __construct(App $app)
    {
        $this->secret = $app->getContainer()->getParameter("node.secret");
        $this->pusher = $app->getContainer()->getParameter("node.api") . "pusher";
        $this->rest = $app->getServices()->get("app.restclient");
    }

    public function push($data, $route)
    {
        $data = Array(
            "topic" => $route,
            "data" => $data
        );

        $this->pushForReal($data, $route);
    }

    public function pushForReal($data, $route)
    {
        $signin_key = $this->pusher_private_key;
        $sent_data = $data["data"];
        if ($signin_key) {
            openssl_sign((string)@json_encode($sent_data), $signed, $signin_key);
            $sent_data["_sign"] = base64_encode($signed);
        }
        
        $pubData = [
            'room' => "previous::".$data["topic"],
            'data' => $sent_data,
        ];

        $data = (string)@json_encode($pubData);
        $this->rest->post($this->pusher, $data, [
            CURLOPT_HTTPHEADER => Array(
                "Authorization: Token ".$this->secret,
                "Content-Type: application/json"
            ),
            CURLOPT_CONNECTTIMEOUT => 1,
            CURLOPT_TIMEOUT => 1
        ]);
    }

}
