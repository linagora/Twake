<?php

namespace Common\Http;


class ParamBag
{
    private $array = [];

    public function __construct($array)
    {
        $this->array = $array;
    }

    public function all()
    {
        return $this->array;
    }

    public function get($key, $default = null)
    {
        return isset($this->array[$key]) ? $this->array[$key] : $default;
    }

    public function has($key)
    {
        return isset($this->array[$key]);
    }

    public function getBoolean($key, $default = false)
    {
        return isset($this->array[$key]) ? !!$this->array[$key] : $default;
    }
    
    public function getInt($key, $default = false)
    {
        return isset($this->array[$key]) ? intval($this->array[$key]) : $default;
    }

    public function reset($array)
    {
        $this->array = $array;
    }
}
