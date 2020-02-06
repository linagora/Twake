<?php

namespace Common;

abstract class BaseServices
{

    protected $services = [];

    public function getServices()
    {
        return $this->services;
    }

}