<?php

namespace Twake\Core\Services\Monitoring;

use Common\Http\Request;
use Common\Http\Response;
use TweedeGolf\PrometheusClient\Collector\CollectorInterface;
use TweedeGolf\PrometheusClient\Collector\Counter;
use TweedeGolf\PrometheusClient\PrometheusException;

/**
 * Class ResponseCodeCollector
 *
 * Handles response status code
 *
 * @package Suez\Bundle\PrometheusMonitoring\Monitoring\Collector
 */
class ResponseCodeCollector extends AbstractCollector
{
    /**
     * The current response code to label the metric
     *
     * @var int
     */
    protected $responseCode = 200;

    /**
     * {@inheritdoc}
     */
    public function collect(Request $request, Response $response)
    {
        $this->responseCode = $response->getStatusCode();
    }

    /**
     * {@inheritdoc}
     */
    public function getCollectorName(): string
    {
        return 'app_collectors_response_code';
    }

    /**
     * {@inheritdoc}
     *
     * Note : overriden because suez_sf_app_response_code is a counter
     *
     * @throws PrometheusException
     */
    public function save(CollectorInterface $collector, array $labelValues)
    {
        /** @var $collector Counter */
        $collector->inc(1, array_merge($labelValues, [(string)$this->responseCode]));
    }
}