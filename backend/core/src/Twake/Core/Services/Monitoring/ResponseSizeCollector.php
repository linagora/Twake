<?php

namespace Twake\Core\Services\Monitoring;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class ResponseSizeCollector
 *
 * Handles response size
 *
 * @package Suez\Bundle\PrometheusMonitoring\Monitoring\Collector
 */
class ResponseSizeCollector extends AbstractCollector
{
    /**
     * {@inheritdoc}
     */
    public function collect(Request $request, Response $response)
    {
        $this->data = strlen($response->getContent());
    }

    /**
     * {@inheritdoc}
     */
    public function getCollectorName(): string
    {
        return 'app_collectors_response_size';
    }
}