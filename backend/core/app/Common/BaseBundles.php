<?php

namespace Common;

/**
 * Bundles root file super class
 */
abstract class BaseBundles
{

    protected $bundles = [];

    public function getBundles()
    {
        return $this->bundles;
    }

}