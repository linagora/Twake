<?php

namespace Twake\Core\Services\Monitoring;

use Common\Http\Request;
use Common\Http\Response;

/**
 * Class MemoryCollector
 *
 * Handles peak memory usage
 *
 * @package Suez\Bundle\PrometheusMonitoring\Monitoring\Collector
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