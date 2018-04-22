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

    // @addApplication add an application to the given group
    public function addApplication($groupId,$appId, $currentUserId = null, $init);

}