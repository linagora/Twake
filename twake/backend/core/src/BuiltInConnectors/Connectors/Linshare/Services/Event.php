<?php

namespace BuiltInConnectors\Connectors\Linshare\Services;

use  LinshareBundle\Entity\LinshareMessage;

class Event
{

    public function __construct($app) {
        $this->main_service = $app->getServices()->get("connectors.common.main");
    }

    public function proceedEvent($type, $event, $data) {
      $this->main_service->setConnector("linshare");

      $group = $data["group"];
      $entity = null;
      $user = $data["user"];
      $workspace = $data["workspace"];

      $form = Array("type" => "nop", "content" => [
          Array("type" => "nop" , "content" =>"Hello !"),
          Array("type" => "br")
      ]);

      $data_string = Array(
          "group_id" => $group["id"],
          "user_id" => $user["id"],
          "connection_id" => $data["connection_id"],
          "form" => $form
      );

      $res = $this->main_service->postApi("general/configure", $data_string);

      error_log(json_encode($res));

    }

}
