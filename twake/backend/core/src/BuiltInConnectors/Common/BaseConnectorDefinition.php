<?php
namespace BuiltInConnectors\Common;

class BaseConnectorDefinition
{
  public $definition = [];
  public $app;

  public function __construct($app){
    $this->app = $app;
  }

  public function setDefinition(){}

  public function setConfiguration(){}

}
