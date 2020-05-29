<?php

namespace Twake\Core\Services\Monitoring;

use Common\Http\Request;
use Common\Http\Response;
use Symfony\Component\HttpKernel\KernelInterface;

/**
 * Class ResponseTimeCollector
 *
 * Handles response time
 *
 * @package Suez\Bundle\PrometheusMonitoring\Monitoring\Collector
 */
class ResponseTimeCollector extends AbstractCollector
{
    /**
     * @var KernelInterface
     */
    protected $kernel;

    /**
     * ResponseTimeDataCollector constructor.
     *
     * @param KernelInterface|null $kernel
     */
    public function __construct($start_time = null)
    {
        $this->start_time = $start_time;
    }

    /**
     * {@inheritdoc}
     */
    public function collect(Request $request, Response $response)
    {
        $startTime = null;

        if (null !== $this->kernel) {
            $startTime = $this->start_time;
        }

        if (is_null($startTime) || $startTime === -INF) {
            $startTime = $request->server->get('REQUEST_TIME_FLOAT');
        }

        $this->data = (microtime(true) - $startTime) * 1000;
    }

    /**
     * {@inheritdoc}
     */
    public function getCollectorName(): string
    {
        return 'app_collectors_response_time';
    }
}