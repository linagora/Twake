<?php


namespace Twake\Core\Services;

use App\App;
use Twake\Core\Entity\ZMQQueue;
use Twake\Core\Services\RememberMe;
use WebSocket\Client;

class Pusher
{

    var $connected = false;
    var $connection = null;
    var $host;
    var $port;
    var $doctrine;

    public function __construct(App $app)
    {
        $this->host = $app->getContainer()->getParameter("websocket.host");
        $this->port = $app->getContainer()->getParameter("websocket.port");
        $this->connection = null;
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

        try {

            if (!$this->connected) {

                $options = [
                    'secure' => false,
                    'host' => $this->host,
                    'port' => $this->port,
                    'path' => '/socketcluster/',
                    'query' => [],
                ];

                $path = $options["secure"] ? "wss" : "ws";
                $path .= "://" . $options["host"];
                $path .= ":" . $options["port"];
                $path .= $options["path"];

                $this->connection = new Client($path);
                $this->connection->send("{\"event\":\"#handshake\",\"data\":{\"authToken\":null},\"cid\":1}");

                $this->connected = true;

            }

            $signin_key = $this->container->getParameter("websocket.pusher_private");
            $sent_data = $data["data"];
            openssl_sign((string)@json_encode($sent_data), $signed, $signin_key);
            $sent_data["_sign"] = $signed;

            $pubData = [
                'channel' => $data["topic"],
                'data' => $sent_data,
            ];
            $eventData = [
                'event' => "#publish",
                'data' => $pubData,
            ];
            $data = (string)@json_encode($eventData);
            $this->connection->send($data);

        } catch (\Exception $e) {
            error_log($e);
        }

    }

}
