<?php


namespace WebsiteApi\CoreBundle\Services;

use WebsiteApi\CoreBundle\Entity\ZMQQueue;
use WebsiteApi\CoreBundle\Services\RememberMe;

class ZMQPusher
{

    var $connected = false;
    var $connection = null;
    var $host;
    var $port;
    var $doctrine;

    public function __construct($host, $port, $em)
    {
        $this->host = $host;
        $this->port = $port;
        $this->doctrine = $em;
        $this->connection = null;
    }

    public function push($data, $route)
    {
        $data = Array(
            "topic" => $route,
            "data" => $data
        );
        $data = json_encode($data);

        $this->pushForReal($data, $route);
        return;

        $job = new ZMQQueue($route, $data);
        $this->doctrine->persist($job);
        $this->doctrine->flush();
    }

    public function pushForReal($data, $route)
    {

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
            $this->connection = $context->getSocket(\ZMQ::SOCKET_PUSH);
            $this->connection->setSockOpt(\ZMQ::SOCKOPT_LINGER, $config['linger']);
            $this->connection->connect($config['protocol'] . "://" . $config['host'] . ":" . $config['port']);
            $this->connection->send($data);
        }

    }

    public function checkQueue()
    {

        $jobs = $this->doctrine->getRepository("TwakeCoreBundle:ZMQQueue")->findBy(Array(), Array(), 5000);

        foreach ($jobs as $job) {
            $this->doctrine->remove($job);
            $this->doctrine->flush();
        }

        foreach ($jobs as $job) {
            $this->pushForReal($job->getData(), $job->getRoute());
        }

    }


}
