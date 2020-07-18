<?php

namespace BuiltInConnectors\Common\Command;

use Common\Commands\ContainerAwareCommand;

class InitConnector extends ContainerAwareCommand
{

    protected function configure()
    {
        $this->setName("twake:init_connector");
    }

    protected function execute()
    {

      $arg_list = $_SERVER['argv'];

      $connector_name = isset($arg_list[0]) ? $arg_list[0] : false;
      if(!$connector_name){

        error_log("⚙️ Installing default connectors defined in configuration");

        $connectors = $this->getApp()->getContainer()->getParameter("defaults.applications.connectors");
        if($connectors){
          foreach($connectors as $name => $configuration){
            $this->toggleConnector($name, !!$configuration, isset($configuration["default"]) && $configuration["default"]);
          }
        }

        die;
      }
      $action_name = isset($arg_list[1]) ? $arg_list[1] : "enable";
      $enable = $action_name != "disable";

      $second_action_name = isset($arg_list[2]) ? $arg_list[2] : "";
      $is_default = $second_action_name == "default";

      $this->toggleConnector($connector_name, $enable, $is_default);

    }

    public function toggleConnector($connector_name, $enable, $is_default){

      error_log(($enable?"Enabling" : "Disabling") . " " . $connector_name. ($is_default?" and default for future workspaces":"") . "!");

      $path = __DIR__ . "/../../Connectors/";
      $dir = new \DirectoryIterator($path);
      $connectors_bundles_instances = [];
      // Require and instanciate all defined connectors
      foreach ($dir as $fileinfo) {
          if ($fileinfo->isDir() && !$fileinfo->isDot()) {
            try{
              $bundle = "BuiltInConnectors/Connectors/" . $fileinfo->getFilename();
              if (file_exists(__DIR__ . "/../../../" . $bundle . "/Bundle.php")) {
                  $class_name = str_replace("/", "\\", $bundle) . "\\Bundle";
                  $connectors_bundles_instances[] = new $class_name($this->app);
              } else {
                  error_log("No such connector bundle " . $bundle);
              }
            }catch(\Exception $err){
              error_log("No such connector bundle " . $fileinfo->getFilename());
              error_log($err->getMessage());
            }
          }
      }

      $found = false;
      // Init routing for all bundles
      foreach ($connectors_bundles_instances as $bundle_instance) {
        if(method_exists($bundle_instance, "getDefinition")){
          $definition = $bundle_instance->getDefinition();

          if($definition["simple_name"] == $connector_name){
              $found = true;

              $server_route = rtrim($this->app->getContainer()->getParameter("env.internal_server_name")?:$this->app->getContainer()->getParameter("env.server_name"), "/");

              $simple_name = $definition["simple_name"];
              $icon = $definition['icon_url'];
              if(!(strpos("http://", $icon) === 0 || strpos("https://", $icon) === 0)){
                $icon = rtrim($this->app->getContainer()->getParameter("env.server_name"), "/") . "/bundle/connectors/" . $definition["simple_name"] . "/icon";
              }

              $app_exists = $this->app->getServices()->get("app.applications")->findAppBySimpleName($simple_name, true);

              $application = [
                'simple_name' => $simple_name,
                'name' => $definition['name'],
                'description' => $definition['description'],
                'icon_url' => $icon,
                'website' => $definition['website'],
                'categories' => $definition['categories'],
                'privileges' => $definition['privileges'],
                'capabilities' => $definition['capabilities'],
                'hooks' => $definition['hooks'],
                'display' => $definition['display'],
                'api_allowed_ips' => $definition['api_allowed_ips'],
                'api_event_url' => $server_route . "/bundle/connectors/" . $definition["simple_name"] . "/" . ltrim($definition['api_event_url'], "/"),
                'public' => true
              ];

              if($enable){
                //Update database with this app
                if(!$app_exists){
                  $new_app = $this->app->getServices()->get("app.applications")->createApp(null, $definition["name"], $simple_name, $definition["app_group_name"], null);
                  $application["id"] = $new_app["id"];
                }else{
                  $application["id"] = $app_exists["id"];
                }

                $this->app->getServices()->get("app.applications")->update($application, null);
                $this->app->getServices()->get("app.applications")->toggleAppValidation($application["id"], true);

                if($is_default){
                  $this->app->getServices()->get("app.applications")->toggleAppDefault($application["id"], true);
                }

                error_log("The connector is now available to the public.");
              }else{
                //If in database, set to non public
                if($app_exists){
                    $application["public"] = false;
                    $application["id"] = $app_exists["id"];
                    $this->app->getServices()->get("app.applications")->toggleAppValidation($application["id"], false);
                    $this->app->getServices()->get("app.applications")->toggleAppDefault($application["id"], false);
                }

                error_log("The connector is now unavailable to the public.");
              }

          }

        }
      }

      if(!$found){
        error_log("This connector was not found.");
      }
    }

}
