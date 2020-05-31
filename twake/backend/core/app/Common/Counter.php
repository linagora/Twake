<?php

namespace Common;

use App\App;

class Counter
{

    private $counters = [];
    private $timers_started = [];
    private $timers_values = [];

    private $dev_mode = false;

    public function __construct(App $app)
    {
        $this->dev_mode = $app->getContainer()->getParameter("env.timer") == true;
    }

    public function incrementCounter($key)
    {
        if (!isset($this->counters["counter_" . $key])) {
            $this->counters["counter_" . $key] = 0;
        }
        $this->counters["counter_" . $key]++;
    }

    public function readCounter($key)
    {
        return isset($this->counters["counter_" . $key]) ? $this->counters["counter_" . $key] : 0;
    }

    public function startTimer($key)
    {
        $this->timers_started[$key] = microtime(true);
    }

    public function stopTimer($key)
    {
        if (!isset($this->timers_values[$key])) {
            $this->timers_values[$key] = 0;
        }
        $this->timers_values[$key] += microtime(true) - $this->timers_started[$key];
        $this->counters["timer_" . $key] = $this->timers_values[$key];
    }

    public function readTimer($key)
    {
        return isset($this->counters["timer_" . $key]) ? $this->counters["timer_" . $key] : -1;
    }

    public function showResults()
    {
        if ($this->dev_mode) {
            error_log(json_encode($this->counters, JSON_PRETTY_PRINT));
        }
    }

}
