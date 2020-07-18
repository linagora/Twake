<?php

namespace BuiltInConnectors\Connectors\Linshare\Services;

use BuiltInConnectors\Connectors\Linshare\ConnectorDefinition;

class Event
{

    public function __construct($app) {
        $this->app = $app;
        $this->main_service = $app->getServices()->get("connectors.common.main");
    }

    public function getJWT($user_email){
      $configuration = (new ConnectorDefinition())->configuration;

      $data = [];
      $data["sub"] = $user_email;

      $linshare_privatekey = $this->app->getContainer()->getParameter("defaults.connectors.linshare.key.private", $configuration["key"]["private"]);
      $data["iss"] = $this->app->getContainer()->getParameter("defaults.connectors.linshare.key.issuer", $configuration["key"]["issuer"]) ?: "Twake";

      // Create JWT
      $header = json_encode(['alg' => 'RS512']);
      $data["iat"] = date("U");
      $data["exp"] = date("U") + 5 * 60;
      $payload = json_encode($data);
      $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
      $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
      openssl_sign( $base64UrlHeader . "." . $base64UrlPayload, $signature, $linshare_privatekey, OPENSSL_ALGO_SHA512);
      $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
      $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

      return $jwt;
    }

    public function proceedEvent($type, $event, $data) {
      $this->main_service->setConnector("linshare");
      $definition = (new ConnectorDefinition())->definition;

      $group = $data["group"];
      $entity = null;
      $user = $data["user"];
      $workspace = $data["workspace"];
      $channel = $data["channel"];
      $parent_message = $data["parent_message"];
      $interactive_context = $data["interactive_context"];

      if ($type == "action") {

        $linshare_domain = $this->app->getContainer()->getParameter("defaults.connectors.linshare.domain", $configuration["domain"]);
        $document_id = $group["id"]."_domain_conf";
        $document_value = $this->main_service->getDocument($document_id);
        if($document_value){
          $linshare_domain = $document_value;
        }

        // GET Documents from LinShare
        $token = $this->getJWT($user["email"]);
        $documents = $this->main_service->get(rtrim($linshare_domain, "/") . "/linshare/webservice/rest/user/documents/", false, [
          CURLOPT_HTTPHEADER => [
            "Accept: application/json",
            "Authorization: Bearer " . $token
          ]
        ]);

        $values = [];
        foreach($documents as $document){
          $uuid = $document["uuid"];
          $values[] = [
            "name" => $document["name"],
            "value" => json_encode(["uuid"=>$uuid, "name"=>$document["name"]])
          ];
        }
        $select = [
            "type" => "select",
            "title"=>"Choose file",
            "values" => $values,
            "passive_id" => "file_select"
        ];

        $form = Array("type" => "nop", "content" => [
          "Choose a file to send from your space",
          Array("type" => "br"),
          $select,
          Array("type" => "br"),
          Array("type" => "button", "action_id" => "send_file", "content" => "Envoyer", "interactive_context" => [
            "channel_id" => $channel["id"]
          ]),
        ]);

        $data_string = Array(
            "group_id" => $group["id"],
            "user_id" => $user["id"],
            "connection_id" => $data["connection_id"],
            "form" => $form
        );

        $res = $this->main_service->postApi("general/configure", $data_string);

      }

      if($type == "interactive_configuration_action" && $event == "send_file"){

        $data_string = Array(
            "group_id" => $group["id"],
            "user_id" => $user["id"],
            "connection_id" =>$data["connection_id"]
        );
        $this->main_service->postApi("general/configure_close", $data_string);

        $file = json_decode($data["form"]["file_select"], 1);
        $server_route = rtrim($this->app->getContainer()->getParameter("env.server_name"), "/");

        if(!$file || !$file["name"]){
          return;
        }

        $download_parameters = [
          "file_uuid=" . $file["uuid"],
          "group_id=" . $group["id"],
          "owner_id=" . $user["id"]
        ];
        $download_route = $server_route . "/bundle/connectors/" . $definition["simple_name"] . "/download";
        $download_route = $download_route . "?" . join("&", $download_parameters);
        $linshare_privatekey = $this->app->getContainer()->getParameter("defaults.connectors.linshare.key.private", $configuration["key"]["private"]);
        openssl_sign($file["uuid"] . $user["id"], $signature, $linshare_privatekey, OPENSSL_ALGO_SHA512);
        $download_route .= "&sign=" . str_replace(str_split('+/='), str_split('._-'), base64_encode($signature));

        $message["channel_id"] = $interactive_context["channel_id"];
        $message["sender"] = $user["id"];
        $message["parent_message_id"] = isset($parent_message["id"])?$parent_message["id"]:"";

        $message["content"] = Array(
          ["type" => "url", "user_identifier" => true, "url" => $download_route, "content" => ["type" => "button", "content" => "Download " . $file["name"]]]
        );
        $message["hidden_data"] = Array(
            "allow_delete" => "everyone"
        );

        $data_string = Array(
            "group_id" => $group["id"],
            "message" => $message
        );

        $message = $this->main_service->postApi("messages/save", $data_string);

      }

    }

    public function download($twake_user, $file_uuid, $group_id, $owner_id, $sign){

      $this->main_service->setConnector("linshare");

      $linshare_publickey = $this->app->getContainer()->getParameter("defaults.connectors.linshare.key.public", $configuration["key"]["public"]);
      $r = openssl_verify($file_uuid . $owner_id, base64_decode(str_replace(str_split('._-'), str_split('+/='), $sign)), $linshare_publickey, OPENSSL_ALGO_SHA512);
      if(!$r){
        echo "This document isn't available.";
        die();
      }


      $linshare_domain = $this->app->getContainer()->getParameter("defaults.connectors.linshare.domain", $configuration["domain"]);
      $document_id = $group_id."_domain_conf";
      $document_value = $this->main_service->getDocument($document_id);
      if($document_value){
        $linshare_domain = $document_value;
      }

      //Get user email
      $user_object = $this->main_service->postApi("users/get", Array("user_id" => $twake_user, "group_id" => $group_id));
      $requester_email = $user_object["object"]["email"];

      //Get owner email
      $owner_email = $requester_email;
      if($twake_user != $owner_id){
        $user_object = $this->main_service->postApi("users/get", Array("user_id" => $owner_id, "group_id" => $group_id));
        $owner_email = $user_object["object"]["email"];
      }

      //TODO download as the requester and not as the owner

      //Test if user has access to this file
      $token = $this->getJWT($owner_email);
      $document = $this->main_service->get(rtrim($linshare_domain, "/") . "/linshare/webservice/rest/user/documents/".$file_uuid, false, [
        CURLOPT_HTTPHEADER => [
          "Accept: application/json",
          "Authorization: Bearer " . $token
        ]
      ]);

      if(!$document){
        echo "This document isn't available.";
        die();
      }

      $size = $document["size"];
      $quoted = $document["name"];

      header('Content-Description: File Transfer');
      header('Content-Type: application/octet-stream');
      header('Content-Disposition: attachment; filename=' . $quoted);
      header('Content-Transfer-Encoding: binary');
      header('Connection: Keep-Alive');
      header('Expires: 0');
      header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
      header('Pragma: public');
      if($size) header('Content-Length: ' . $size);

      $url = rtrim($linshare_domain, "/") . "/linshare/webservice/rest/user/documents/".$file_uuid."/download";

      $options = [
        CURLOPT_HTTPHEADER => [
          "Accept: application/json",
          "Authorization: Bearer " . $token
        ]
      ];

      $options[CURLOPT_RETURNTRANSFER] = true;
      $options[CURLOPT_HEADER] = false;
      $options[CURLOPT_URL] = $url;
      $options[CURLOPT_CUSTOMREQUEST] = "GET";

      $curl_write_flush = function ($curl_handle, $chunk)
      {
          echo $chunk;
          ob_flush(); // flush output buffer (Output Control configuration specific)
          flush();    // flush output body (SAPI specific)
          return strlen($chunk); // tell Curl there was output (if any).
      };

      $curl = curl_init();
      curl_setopt_array($curl, $options);
      curl_setopt($curl, CURLOPT_BINARYTRANSFER, 1);
      curl_setopt($curl, CURLOPT_WRITEFUNCTION, $curl_write_flush);
      curl_exec($curl);
      curl_close($curl);

      die();

    }

}
