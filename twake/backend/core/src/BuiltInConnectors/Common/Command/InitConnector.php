<?php

namespace BuiltInConnectors\Common\Command;

use Common\Commands\ContainerAwareCommand;

class ReminderCheckerCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this->setName("twake:init_connector");
    }

    protected function execute()
    {

      error_log(json_encode(func_get_args()));

      $path = __DIR__ . "/../../Connectors/"
      $dir = new DirectoryIterator($path);
      $connectors_bundles_instances = [];
      // Require and instanciate all defined connectors
      foreach ($dir as $fileinfo) {
          if ($fileinfo->isDir() && !$fileinfo->isDot()) {
            try{
              $bundle = "BuiltInConnectors/Connectors/" . $file->getFilename();
              if (file_exists(__DIR__ . "/../src/" . $bundle . "/Bundle.php")) {
                  require_once __DIR__ . "/../src/" . $bundle . "/Bundle.php";
                  $class_name = str_replace("/", "\\", $bundle) . "\\Bundle";
                  $connectors_bundles_instances[] = new $class_name($this);
              } else {
                  error_log("No such connector bundle " . $bundle);
              }
            }catch(\Exception $err){
              error_log("No such connector bundle " . $file->getFilename());
              error_log($err->getMessage());
            }
          }
      }

      // Init routing for all bundles
      foreach ($connectors_bundles_instances as $bundle_instance) {
        if(method_exists($bundle_instance, "getDefinition")){
          $definition = $bundle_instance->getDefinition();
          error_log(json_encode($definition));
        }
      }
    }

}
