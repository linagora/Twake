<?php


namespace WebsiteApi\CoreBundle\Services;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Routing\Router;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Doctrine\ORM\EntityManager;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use WebsiteApi\CoreBundle\Services\RememberMe;

class ZMQPusher
{

    var $connected = false;
    var $connection = null;
    var $host;
    var $port;

	public function __construct($host, $port) {
        $this->host = $host;
        $this->port = $port;
	}

	public function push($data, $route){

        if (false === $this->connected) {
            if (!extension_loaded('zmq')) {
                throw new \RuntimeException(sprintf(
                    '%s pusher require ZMQ php extension',
                    get_class($this)
                ));
            }

            $config = Array(
                "persistent" => false,
                "protocol" => "tcp",
                "linger" => 1,
                "host" => $this->host,
                "port" => $this->port
            );

            $context = new \ZMQContext(1, $config['persistent']);
            $this->connection = new \ZMQSocket($context, \ZMQ::SOCKET_PUSH);
            $this->connection->setSockOpt(\ZMQ::SOCKOPT_LINGER, $config['linger']);
            $this->connection->connect($config['protocol'] . '://' . $config['host'] . ':' . $config['port']);

            $this->connected = true;
        }

        $data = Array(
            "topic" => $route,
            "data" => $data
        );

        $data = json_encode($data);

        $this->connection->send($data);

	}



}
