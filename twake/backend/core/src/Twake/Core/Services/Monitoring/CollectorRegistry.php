<?php

namespace Twake\Core\Services\Monitoring;

use Common\Http\Request;
use Common\Http\Response;
use TweedeGolf\PrometheusClient\CollectorRegistry as PrometheusCollectorRegistry;

/**
 * Class CollectorRegistry
 *
 * The registry of data collectors in the API
 *
 * @package Suez\Bundle\PrometheusMonitoring\Monitoring
 */
class CollectorRegistry
{
    /**
     * @var AbstractCollector[]
     */
    protected $collectors = [];

    /**
     * Registry of collector to translate and save collected metrics into Prometheus format
     *
     * @var PrometheusCollectorRegistry
     */
    protected $registry;

    /**
     * The current name to label metrics
     *
     * @var string
     */
    protected $routeName;

    /**
     * The code of the App to label metrics
     * @var string
     */
    protected $appCode;

    /**
     * CollectorRegistry constructor.
     *
     * @param string $appCode
     * @param PrometheusCollectorRegistry $registry
     */
    public function __construct(string $appCode, PrometheusCollectorRegistry $registry)
    {
        $this->appCode = $appCode;
        $this->registry = $registry;
    }

    public function init()
    {
        $this->addCollector(new MemoryCollector());
        $this->addCollector(new ResponseCodeCollector());
        $this->addCollector(new ResponseSizeCollector());
        $this->addCollector(new ResponseTimeCollector());
    }

    /**
     * Add a collector to the registry
     *
     * @param AbstractCollector $collector
     */
    public function addCollector(AbstractCollector $collector)
    {
        $this->collectors[] = $collector;
    }

    public function setAppCode($code)
    {
        $this->appCode = $code;
    }

    /**
     * Trigger data collection on all collectors
     *
     * @param Request $request
     * @param Response $response
     */
    public function collect(Request $request, Response $response)
    {
        foreach ($this->collectors as $collector) {
            $collector->collect($request, $response);
        }
    }

    /**
     * Set the current route name
     *
     * @param string $routeName
     */
    public function setCurrentRoute($routeName)
    {
        $this->routeName = $routeName;
    }

    /**
     * Save the collected metrics to the backend in Prometheus format
     *
     * @throws \TweedeGolf\PrometheusClient\PrometheusException
     */
    public function save()
    {
        if (!function_exists('apcu_add')) {
            return;
        }

        foreach ($this->collectors as $collector) {
            if ($this->routeName) {
                $collector->save(
                    $this->registry->get($collector->getCollectorName()),
                    [$this->appCode, $this->routeName]
                );
            }
        }

        if ($this->routeName) {
            $this->registry->getCounter('app_collectors_call_count')->inc(
                1,
                [$this->appCode, $this->routeName]
            );
        }
    }
}