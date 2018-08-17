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

    public function pushForReal($data, $route)
    {

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
            $this->connection->connect($config['protocol'] . "://" . $config['host'] . ":" . $config['port']);

            $this->connected = true;
        }

        $this->connection->send($data);
	}



}
