<?php

namespace WebsiteApi\MarketBundle\Model;

/**
 * This is an interface for the service GroupApps
 */
interface MarketApplicationInterface
{

    // @getApps return list of all apps
    public function getApps();

    // @getAppsByName use a name and find all applications with like %name%
    public function getAppsByName($name);

}