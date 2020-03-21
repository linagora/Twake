<?php

namespace Twake\Notifications\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Services\Queues\Adapters\QueueManager;

// Configuration
use Pusher\Adapter\AdapterInterface;
use Pusher\Adapter\Apns;
use Pusher\Adapter\Fcm;
use Pusher\Collection\DeviceCollection;
use Pusher\Model\Device;
use Pusher\Model\Push;
use Pusher\Pusher;


class NotificationQueueCommand extends ContainerAwareCommand
{

    var $parameters = [];

    protected function configure()
    {
        $this->setName("twake:notifications_queue");
    }

    protected function execute()
    {

        $services = $this->getApp()->getServices();
        $em = $services->get('app.twake_doctrine');
        /** @var QueueManager $queues */
        $queues = $services->get('app.queues')->getAdapter();

        $circle = $services->get("app.restclient");
        $key = $this->getApp()->getContainer()->getParameter('LICENCE_KEY');
        $this->parameters = $this->getApp()->getContainer()->getParameter("push_notifications");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {

            $messages = $queues->consume("push_notification", true);

            if (count($messages) == 0) {
                sleep(1);
            } else {

                if (!$this->getApp()->getContainer()->getParameter('STANDALONE')) {
                    $masterServer = "https://app.twakeapp.com/api/remote/push";
                    $dataArray = Array(
                        "licenceKey" => $key,
                        "data" => Array()
                    );
                    foreach ($messages as $message) {
                        $push_message = $queues->getMessage($message);
                        $dataArray["data"][] = $push_message;
                    }
                    $circle->post($masterServer, json_encode($dataArray), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 3, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
                }

                foreach ($messages as $queue_message) {
                    $push_message = $queues->getMessage($queue_message);

                    if ($this->getApp()->getContainer()->getParameter('STANDALONE')) {
                        $data = $push_message;

                        if ($data) {

                            $message = $data["message"];
                            $title = $data["title"];
                            $addon = $data["data"];
                            $badge = intval($data["badge"]);
                            $device_id = $data["device_id"];

                            if (strtolower($data["type"]) == "apns") {
                                $this->sendAPNS($device_id, $title, $message, $addon, $badge);
                            } else {
                                $this->sendFCM($device_id, $title, $message, $addon, $badge);
                            }

                        }
                    }


                    $queues->ack("push_notification", $queue_message);
                }


            }
        }

    }

    function sendAPNS($deviceId, $title, $message, $data, $badge)
    {
        $apns_certificate = $this->parameters["apns_certificate"];

        $data = Array(
            "aps" => Array(
                "alert" => Array(
                    "title" => $title,
                    "body" => $message
                ),
                "badge" => $badge
            ),
            "notification_data" => $_data ? $_data : Array()
        );

        if ($title || $message) {
            $data["aps"]["sound"] = "default";
        }

        $serverKey = $apns_certificate;

        $devices = new DeviceCollection([new Device($deviceId)]);
        $adapter = new Apns($serverKey, AdapterInterface::ENVIRONMENT_PRODUCTION);


        $pusher = new Pusher([new Push($adapter, $devices, $data)]);
        $pusher->push();

    }

    function sendFCM($deviceId, $title, $message, $_data, $badge)
    {
        $firebase_api_key = $this->parameters["firebase_api_key"];

        $data = Array(
            "title" => $title,
            "body" => $message,
            "data" => $_data,
        );

        if ($title || $message) {
            $data["sound"] = "default";
        }

        $serverKey = $firebase_api_key;

        $devices = new DeviceCollection([new Device($deviceId)]);
        $adapter = new Fcm($serverKey);

        $pusher = new Pusher([new Push($adapter, $devices)]);
        $pusher->push($data, $_data);
    }


}