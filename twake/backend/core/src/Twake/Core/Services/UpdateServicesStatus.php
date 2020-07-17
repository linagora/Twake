<?php

namespace Twake\Core\Services;
use App\App;

class UpdateServicesStatus
{

    public function __construct(App $app){
        $this->app = $app;
    }

    public function execute($update_status = true)
    {

      $status_content = "";
      try{
        $status_content = @file_get_contents("/tmp/twake.status");
      }catch(\Exception $err){
        error_log($err->getMessage());
      }

      $ready = [ //Array or "true"
        "elasticsearch_connection" => false,
        "elasticsearch_mapping" => false,
        "db_connection" => false,
        "db_mapping" => false,
        "init" => false
      ];
      $has_false = false;
      foreach ($ready as $key => $_) {
        $ready[$key] = (strpos($status_content, ";".$key.";") !== false);
        if(!$ready[$key]){
          $has_false = true;
        }
      }
      if($has_false){

        if($update_status){

          $status = ";";

          //Check ES
          $es_not_found = @file_get_contents("/twake.status.no_es") === "1";
          if($es_not_found || !$this->app->getContainer()->getParameter("es.host")){
            $status .= "elasticsearch_connection;elasticsearch_mapping;";
          }else{
            $test = $this->app->getServices()->get("app.restclient")->get("http://" . $this->app->getContainer()->getParameter('es.host'));
            if($test){
              $status .= "elasticsearch_connection;";

              $service_status = @file_get_contents("/twake.status.es_mapping") === "1";
              if($service_status){
                $status .= "elasticsearch_mapping;";
              }
            }
          }

          //Check scyllaDB
          try{
            $doctrine = $this->app->getServices()->get('app.twake_doctrine');
            $em = $doctrine->getManager();
            $connection = $em->getConnection();
            $connection = $connection->getWrappedConnection();
            $connected = true;
          }catch(\Exception $e){
            $connected = false;
          }
          if($connected){
            $status .= "db_connection;";

            $service_status = @file_get_contents("/twake.status.db_init") === "1";
            if($service_status){
              $status .= "db_mapping;";
            }

          }

          $service_status = @file_get_contents("/twake.status.init") === "1";
          if($service_status){
            $status .= "init;";
          }

          @file_put_contents("/tmp/twake.status", $status);

          return $this->execute(false);
        }

      }else{
        $ready = true;
      }

      return $ready;

    }

}
