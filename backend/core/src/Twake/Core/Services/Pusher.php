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
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->connection = null;
    }

    public function push($data, $route)
    {
        $data = Array(
            "topic" => $route,
            "data" => $data
        );

        $this->pushForReal($data, $route);
        return;

        $job = new ZMQQueue($route, $data);
        $this->doctrine->persist($job);
        $this->doctrine->flush();
    }

    public function pushForReal($data, $route)
    {

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

        $client = new Client($path);
        try {
            $client->send("{\"event\":\"#handshake\",\"data\":{\"authToken\":null},\"cid\":1}");

            $pubData = [
                'channel' => $data["topic"],
                'data' => $data["data"],
            ];
            $eventData = [
                'event' => "#publish",
                'data' => $pubData,
            ];
            $data = (string)@json_encode($eventData);
            $client->send($data);

            error_log("send websocket message");
        } catch (\Exception $e) {
            error_log($e);
        }

    }

    public function checkQueue()
    {

        $jobs = $this->doctrine->getRepository("Twake\Core:ZMQQueue")->findBy(Array(), Array(), 5000);

        foreach ($jobs as $job) {
            $this->doctrine->remove($job);
            $this->doctrine->flush();
        }

        foreach ($jobs as $job) {
            $this->pushForReal($job->getData(), $job->getRoute());
        }

    }


}
