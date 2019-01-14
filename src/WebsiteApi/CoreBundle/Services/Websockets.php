<?php

namespace WebsiteApi\CoreBundle\Services;

use Swift_Signers_DKIMSigner;
use WebsiteApi\CoreBundle\Entity\WebsocketsRoute;

/**
 * Class TwakeMailer
 * @package WebsiteApi\CoreBundle\Services
 *
 * This class send mail with twake default template
 */
class TwakeMailer
{

    private $doctrine;
    private $pusher;

    public function __construct($doctrine, $pusher)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;

    }

    public function init($route, $data)
    {

        $routes = $this->doctrine->getRepository("TwakeCoreBundle:WebsocketsRoutes");
        $route_entity = $routes->findOneBy(Array("route" => $route));

        if (!$route_entity) {
            $route_entity = new WebsocketsRoute();
            $route_entity->setRoute($route);
            $route_entity->setData($data);
        }

        $route_entity->setLastAccessDate();

        //TODO verify user has access

        $new_key_part = bin2hex(random_bytes(30));
        $new_key = hash('sha256', $route_entity->getKey() . $new_key_part);

        $route_endpoint = $route_entity->getRouteRandomEndpoint();
        $key_version = $route_entity->getKeyVersion() + 1;

        $this->push($route_endpoint, Array(
            "new_key" => $new_key_part,
            "key_version" => $key_version
        ));


        $route_entity->setKey($new_key);
        $this->doctrine->persist($route_entity);
        $this->doctrine->flush();

        return Array(
            "route_id" => $route_endpoint,
            "key" => $new_key,
            "key_version" => $key_version
        );

    }

    public function push($route, $event)
    {

        $routes = $this->doctrine->getRepository("TwakeCoreBundle:WebsocketsRoutes");
        $route_entity = $routes->findOneBy(Array("route" => $route));

        if (!$route_entity) {
            return false;
        }

        $route_endpoint = $route_entity->getRouteRandomEndpoint();
        $key_version = $route_entity->getKeyVersion();
        $key = $route_entity->getKey();

        //Encrypt event
        $string = json_encode($event);
        $encrypted = trim(
            base64_encode(
                openssl_encrypt(
                    $string,
                    "AES-256-CBC",
                    $key,
                    true,
                    ""
                )
            )
        );

        $this->pusher->push("collections/" . $route_endpoint, Array(
            "encrypted" => $encrypted,
            "key_version" => $key_version
        ));

    }

}