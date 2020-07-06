<?php

namespace BuiltInConnectors\Connectors\Linshare\Services;

use BuiltInConnectors\Connectors\Linshare\ConnectorDefinition;

class Configure
{

    public function __construct($app) {
      $this->app = $app;
      $this->main_service = $app->getServices()->get("connectors.common.main");
    }

    public function proceedEvent($type, $event, $data) {
      $this->main_service->setConnector("linshare");
      $configuration = (new ConnectorDefinition())->configuration;
      $linshare_domain = $this->app->getContainer()->getParameter("defaults.connectors.linshare.domain", $configuration["domain"]);

      $group = $data["group"];
      $entity = null;
      $user = $data["user"];
      $workspace = $data["workspace"];

      if($event == "save_configuration_domain"){

        $document_id = $group["id"]."_domain_conf";
        $document_value = $data["form"]["domain_url"];
        $this->main_service->saveDocument($document_id, $document_value);

        $type = "configuration"; //Reopen/Update configuration
      }

      if ($type == "configuration") {

        $document_id = $group["id"]."_domain_conf";
        $document_value = $this->main_service->getDocument($document_id);
        if($document_value){
          $linshare_domain = $document_value;
        }

        $linshare_publickey = $this->app->getContainer()->getParameter("defaults.connectors.linshare.key.public", $configuration["key"]["public"]);

        $form = Array("type" => "nop", "content" => [
            Array("type" => "nop" , "content" => "• To configure your company with LinShare you must enter your LinShare domain URL first."),
            Array("type" => "br"),
            Array("type" => "br"),
            Array("type" => "bold" , "content" => "Domain url"),
            Array("type" => "br"),
            Array("type" => "input", "placeholder" => "https://linshare.org", "content" => $linshare_domain, "passive_id" => "domain_url"),
            Array("type" => "button", "content" => "Save domain", "action_id" => "save_configuration_domain", "style" => "primary"),
            Array("type" => "br"),
            Array("type" => "system" , "content" => ["Current domain is ", Array("type" => "bold" , "content" => $linshare_domain)]),
            Array("type" => "br"),
            Array("type" => "br"),
            Array("type" => "nop" , "content" => "• To authorize Twake in LinShare, add this public key to LinShare adminitration."),
            Array("type" => "br"),
            Array("type" => "br"),
            Array("type" => "bold" , "content" => "Public key"),
            Array("type" => "br"),
            Array("type" => "mcode", "content" => $linshare_publickey)
        ]);

        $data_string = Array(
            "group_id" => $group["id"],
            "user_id" => $user["id"],
            "connection_id" => $data["connection_id"],
            "form" => $form
        );

        $res = $this->main_service->postApi("general/configure", $data_string);

      }

    }

}
