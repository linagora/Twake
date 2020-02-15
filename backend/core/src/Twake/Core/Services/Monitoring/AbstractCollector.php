<?php

namespace Twake\Core\Services\Monitoring;

use Common\Http\Request;
use Common\Http\Response;
use TweedeGolf\PrometheusClient\Collector\CollectorInterface as PrometheusCollectorInterface;
use TweedeGolf\PrometheusClient\Collector\Gauge;
use TweedeGolf\PrometheusClient\PrometheusException;

/**
 * Class AbstractCollector
 *
 * Base class for all metrics collector
 *
 * It assumes that the Prometheus metric type is gauge per default
 *
 * @package Suez\Bundle\PrometheusMonitoring\Monitoring\Collector
 */
abstract class AbstractCollector
{
    /**
     * The collected data
     *
     * @var mixed
     */
    protected $data;

    /**
     * Collect the metric using the request and/or response objects
     *
     * @param Request $request
     * @param Response $response
     * @return void
     */
    abstract public function collect(Request $request, Response $response);

    /**
     * Get the name of the prometheus collector for this metric
     *
     * Note : it must matches a collector from the prometheus bundle
     *
     * @return string
     */
    abstract public function getCollectorName(): string;

    /**
     * Format the collected metric for prometheus and save it
     *
     * Note : the default implementation assumes that the metric is a gauge
     *
     * @param PrometheusCollectorInterface $collector
     * @param array $labelValues label values for the prometheus metric
     *
     * @throws PrometheusException
     */
    public function save(PrometheusCollectorInterface $collector, array $labelValues)
    {
        /** @var $collector Gauge */
        $collector->set($this->getData(), $labelValues);
    }

    /**
     * Return the collected data
     *
     * @return mixed
     */
    public function getData()
    {
        return $this->data;
    }
}