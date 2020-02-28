<?php

// Configuration
use Pusher\Adapter\AdapterInterface;
use Pusher\Adapter\Apns;
use Pusher\Adapter\Fcm;
use Pusher\Collection\DeviceCollection;
use Pusher\Model\Device;
use Pusher\Model\Push;
use Pusher\Pusher;

require("vendor/autoload.php");
require("config/configuration.php");

$apns_certificate = $configuration["apns_certificate"];
$firebase_api_key = $configuration["firebase_api_key"];

function sendAPNS($deviceId, $title, $message, $data, $badge){
    global $apns_certificate;

    $data = Array(
        "aps" => Array(
            "alert" => Array(
                "title" => $title,
                "body" => $message
            ),
            "badge" => $badge
        ),
        "notification_data" => $_data?$_data:Array()
    );

    if($title || $message){
      $data["aps"]["sound"] = "default";
    }

    $serverKey = $apns_certificate;

    $devices = new DeviceCollection([new Device($deviceId)]);
    $adapter = new Apns($serverKey, AdapterInterface::ENVIRONMENT_PRODUCTION);

    $pusher = new Pusher([new Push($adapter, $devices)]);
    $pusher->push($data);

}

function sendFCM($deviceId, $title, $message, $_data, $badge){
    global $firebase_api_key;

    $data = Array(
        "title" => $title,
        "body" => $message,
        "data" => $_data,
    );

    if($title || $message){
      $data["sound"] = "default";
    }

    $serverKey = $firebase_api_key;

    $devices = new DeviceCollection([new Device($deviceId)]);
    $adapter = new Fcm($serverKey);

    $pusher = new Pusher([new Push($adapter, $devices)]);
    $pusher->push($data, $_data);
}


$data = json_decode(file_get_contents('php://input'), true);

ignore_user_abort(true);
set_time_limit(0);

ob_start();
header('Connection: close');
header('Content-Length: '.ob_get_length());
ob_end_flush();
ob_flush();
flush();

error_log(json_encode($data));

if($data){

    $message = $data["message"];
    $title = $data["title"];
    $addon = $data["data"];
    $badge = intval($data["badge"]);
    $device_id = $data["device_id"];

    if(strtolower($data["type"])=="apns"){
        sendAPNS($device_id, $title, $message, $addon, $badge);
    }else{
        sendFCM($device_id, $title, $message, $addon, $badge);
    }

}

?>
