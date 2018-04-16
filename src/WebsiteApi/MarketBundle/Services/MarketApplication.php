<?php

namespace WebsiteApi\MarketBundle\Services;

use WebsiteApi\MarketBundle\Model\MarketApplicationInterface;

class MarketApplication implements MarketApplicationInterface
{
    private $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function getApps()
    {
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findBy(Array(),array('name' => 'ASC'), 50);

        return $applications;
    }
    public function getAppsByName($name)
    {
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findApplicationByName($name);

        return $applications;
    }

}