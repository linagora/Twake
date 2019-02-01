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

class ElasticSearch
{

    var $circle;
    var $server;

    public function __construct($server, $circle)
    {
        $this->circle = $circle;
        $this->server = $server;
    }

    public function put($entity, $type, $index = "twake")
    {

        if (is_array($entity)) {
            $id = $entity["id"];
            $data = $entity["data"];

            if (!is_array($data)) {
                $data = Array("content" => $data);
            }
        } else {
            $id = $entity->getId();

            if (method_exists($entity, "getIndexationArray")) {
                $data = $entity->getIndexationArray();
            } else {
                $data = $entity->getAsArray();
            }
        }

        $route = "http://" . $this->server . "/" . $index . "/" . $type . "/" . $id;

        $this->circle->put($route, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));

    }

    public function remove($entity, $type, $index = "twake")
    {

        if (is_array($entity)) {
            $id = $entity["id"];
        } else {
            $id = $entity->getId();
        }

        $route = "http://" . $this->server . "/" . $index . "/" . $type . "/" . $id;

        $this->circle->delete($route);
    }

    public function search($options = Array(), $type = null, $index = "twake")
    {

        if (isset($options["type"]) && !$type) {
            $type = $options["type"];
        }

        $route = "http://" . $this->server . "/" . $index . "/";
        if ($type) {
            $route .= $type . "/";
        }
        $route .= "_search";

        $this->circle->post($route, json_encode(Array("query" => $options["query"])), array(CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));

    }

}
