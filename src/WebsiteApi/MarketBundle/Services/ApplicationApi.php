<?php

namespace WebsiteApi\MarketBundle\Services;

use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\MarketBundle\Model\MarketApplicationInterface;
use WebsiteApi\WorkspacesBundle\Entity\AppPricingInstance;
use WebsiteApi\WorkspacesBundle\Entity\GroupApp;

class ApplicationApi
{
    private $doctrine;
    private $rest_client;

    public function __construct($doctrine, $rest_client)
    {
        $this->doctrine = $doctrine;
        $this->rest_client = $rest_client;
    }

    public function hasResource($app_id, $workspace_id, $resource_type, $resource_id)
    {

    }

    public function hasPrivilege($app_id, $group_id, $privileges = [])
    {

    }

    public function setAsync()
    {
        $this->async = true;
    }

    public function unsetAsyncAndFlush()
    {
        $this->async = false;
        if ($this->curl_rcx) {
            $this->curl_rcx->execute();
        }
    }

    public function notifyApp($app_id, $event)
    {


        if (!$this->curl_rcx) {
            $this->curl_rcx = new RollingCurlX(10);
            $this->curl_rcx->setTimeout(100);
            $this->curl_rcx->setHeaders(['Content-Type: application/json']);
        }

        $repo = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $repo->findOneBy(Array("id" => $app_id));

        $event_route = $app->getApiEventsUrl();

        //Check route is correct
        if (!parse_url($event_route, PHP_URL_HOST)) {
            return false;
        }
        $event_route = preg_replace("/^\/+/", "", $event_route);

        $use_https = false;
        if (strpos($event_route, "https") === 0) {
            $use_https = true;
        }

        $event_route = preg_replace("/^https?+:\/\//", "", $event_route);
        $event_route = preg_replace("/\/+/", "/", $event_route);
        $parts = explode("/", $event_route);
        if (count($parts) == 1 || $parts[1] == "" || $parts[0] == "") {
            return false; //No domain or no route
        }

        if ($use_https) {
            $event_route = "https://" . $event_route;
        } else {
            $event_route = "http://" . $event_route;
        }


        $data = json_encode($event);

        try {

            $this->curl_rcx->addRequest($event_route, $data);

            if (!$this->async) {
                $this->curl_rcx->execute();
            }

        } catch (\Exception $e) {
            //Timeout exceeded maybe
        }

        return true;

    }

    public function addResource($app_id, $workspace_id, $resource_type, $resource_id)
    {

    }

    public function removeResource($app_id, $workspace_id, $resource_type, $resource_id)
    {

    }

}