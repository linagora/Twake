<?php

namespace WebsiteApi\CoreBundle\Services\Monitoring;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class MemoryCollector
 *
 * Handles peak memory usage
 *
 * @package Suez\Bundle\PrometheusMonitoringBundle\Monitoring\Collector
 */
class MemoryCollector extends AbstractCollector
{
    /**
     * {@inheritdoc}
     */
    public function collect(Request $request, Response $response)
    {
        $this->data = memory_get_peak_usage(true);
    }

    /**
     * {@inheritdoc}
     */
    public function getCollectorName(): string
    {
        return 'app_collectors_memory_usage';
    }
}