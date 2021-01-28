<?php

namespace Twake\Notifications\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Core\Services\Queues\Adapters\QueueManager;

// Configuration
use Pusher\Adapter\AdapterInterface;
use Pusher\Adapter\Apns;
use Pusher\Collection\DeviceCollection;
use Pusher\Model\Device;
use Pusher\Model\Push;
use Pusher\Pusher;

use Emojione\Client;
use Emojione\Ruleset;

class NodePushNotifications extends ContainerAwareCommand
{

    var $parameters = [];

    protected function configure()
    {
        $this->setName("twake:node:push_mobile");
    }

    protected function execute()
    {

        $services = $this->getApp()->getServices();
        $em = $services->get('app.twake_doctrine');
        /** @var QueueManager $queues */
        $queues = $services->get('app.queues')->getAdapter();
        $messagesRepo = $em->getRepository("Twake\Discussions:Message");
        $devicesRepo = $em->getRepository("Twake\Users:Device");
        $this->emojione_client = new Client(new Ruleset());

        $this->parameters = $this->getApp()->getContainer()->getParameter("push_notifications");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {

            $messages = $queues->consume("notification:push:mobile", true, 10, 60, ["exchange_type" => "fanout"]);

            if (count($messages) == 0) {
                sleep(1);
            } else {

                foreach ($messages as $queue_message) {
                    $push_message = $queues->getMessage($queue_message);

                    $company_id = $push_message["company_id"];
                    $workspace_id = $push_message["workspace_id"];
                    $channel_id = $push_message["channel_id"];
                    $message_id = $push_message["message_id"];
                    $thread_id = $push_message["thread_id"];
                    $user_id = $push_message["user"];
                    $badge_value = $push_message["value"];

                    //Get $title and $message from $message_id
                    $messageEntity = $messagesRepo->findOneBy(["id" => $message_id]);
                    $title = $push_message["title"];
                    $message = $push_message["text"];
            
                    $device_data = [
                        "company_id" => $company_id,
                        "workspace_id" => $workspace_id,
                        "channel_id" => $channel_id,
                        "message_id" => $message_id,
                        "thread_id" => $thread_id,
                    ];

                    $devices = $devicesRepo->findBy(Array("user_id" => $user_id));
                    
                    foreach($devices as $device){

                        if (strtolower($device->getType()) == "apns") {
                            $this->sendAPNS($device->getValue(), $title, $message, $device_data, $badge_value);
                        } else {

                            $firebase_api_key = $this->parameters["firebase_api_key"];
                            $adapter = new Fcm($firebase_api_key);
                    
                            $adapter->push([$device->getValue()], [
                                'data' => [
                                    "notification_data" => $device_data,
                                    "click_action" => "FLUTTER_NOTIFICATION_CLICK"
                                ],
                                'notification' => [
                                    "title" => $title,
                                    "body" => $message,
                                    "sound" => "default",
                                    "badge" => $badge_value,
                                    "click_action" => "FLUTTER_NOTIFICATION_CLICK"
                                ],
                                'collapse_key' => $channel_id,
                            ]);
                    
                            //We could use $adapter->getFeedback(); to get invalid tokens
                    
                        }

                    }

                }

                $queues->ack("notification:push:mobile", $queue_message, ["exchange_type" => "fanout"]);

            }

        }

    }

    function sendAPNS($deviceId, $title, $message, $_data, $badge)
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


        $pusher = new Pusher([new Push($adapter, $devices)]);
        $pusher->push($data);

    }

}

class Fcm
{

    const API_URL = 'https://fcm.googleapis.com/fcm/send';

    protected $serverKey;
    protected $environment;
    protected $invalidTokens = [];

    public function __construct(string $serverKey)
    {
        $this->serverKey = $serverKey;
    }

    public function push($devices, $data)
    {
        $data = array_merge($data, [
            'registration_ids' => $devices,
        ]);

        $ch = curl_init(self::API_URL);
        curl_setopt_array($ch, [
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: key=' . $this->serverKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($data),
        ]);

        error_log($response);

        if (!$response = curl_exec($ch)) {
            error_log("Error while sending fcm messages unable to read response.");
            return;
        }

        if (!$response = json_decode($response, true)) {
            error_log("Error while sending fcm messages unable to decode json response.");
            return;
        }

        foreach ($response['results'] as $k => $result) {
            if (!empty($result['error'])) {
                $this->invalidTokens[] = $devices[$k];
            }
        }
    }

    public function getFeedback():array
    {
        $result = $this->invalidTokens;
        $this->invalidTokens = [];
        return $result;
    }
}
