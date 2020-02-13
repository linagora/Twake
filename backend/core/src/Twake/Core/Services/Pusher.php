<?php


namespace Twake\Core\Services;

use App\App;
use Twake\Core\Entity\ZMQQueue;
use Twake\Core\Services\RememberMe;

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

        $websocket = \SocketCluster\WebSocket::factory($options);
        $socket = new \SocketCluster\SocketCluster($websocket);

        // Event Emit
        $socket->publish($data["topic"], $data["data"]);

        /*

        $config = Array(
            "linger" => 1,
            "protocol" => "tcp",
            "host" => $this->host,
            "port" => $this->port
        );

        if (!extension_loaded('zmq')) {
            throw new \RuntimeException(sprintf(
                '%s pusher require ZMQ php extension',
                get_class($this)
            ));
        }

        if ($this->connection) {
            $this->connection->send($data);
        } else {
            $context = new \ZMQContext(1);
            error_log("get socket...");
            $this->connection = $context->getSocket(\ZMQ::SOCKET_PUSH);
            $this->connection->setSockOpt(\ZMQ::SOCKOPT_LINGER, $config['linger']);
            error_log("connect socket... " . $config['protocol'] . "://" . $config['host'] . ":" . $config['port']);
            $this->connection->connect($config['protocol'] . "://" . $config['host'] . ":" . $config['port']);
            error_log("send...");
            $this->connection->send($data);
            error_log("sent !");
        }*/

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
