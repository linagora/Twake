<?php


namespace Twake\Core\Services\Queues;

use App\App;
use Twake\Core\Entity\ScheduledTask;
use Twake\Core\Entity\ScheduledCounter;
use Twake\Core\Services\DoctrineAdapter\ManagerAdapter;
use Twake\Core\Services\Queues\Adapters\QueueManager;

/**
 * Class Scheduled
 * Used to generate scheduled tasks (calendar, tasks etc)
 * @package Twake\Core\Services\Queues
 */
class Scheduled
{

    var $bulk_size = 100;
    var $time_interval = 15 * 60;
    var $max_ttl = 20 * 364 * 24 * 60 * 60;

    /** @var ManagerAdapter */
    var $doctrine;
    /** @var QueueManager */
    var $queues;

    var $already_sent_shard = [];

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->queues = $app->getServices()->get("app.queues")->getAdapter();
    }

    private function timeKeyFromTimestamp($timestamp)
    {
        return floor(($timestamp / $this->time_interval)) * $this->time_interval;
    }

    /** Schedule a task, called once by one node */
    public function schedule($route, $timestamp, $message)
    {
        if ($timestamp < date("U")) {
            return;
        }

        if ($timestamp < date("U") + 15 * 60) {
            $this->queues->push("scheduled_notifications_" . $route, [
                "message" => $message,
                "timestamp" => $timestamp
            ], [
                "delay" => $timestamp - date("U")
            ]);
            return true;
        }

        //Get current counter state (if exists)
        $counter_repository = $this->doctrine->getRepository("Twake\Core:ScheduledCounter");
        $counter = $counter_repository->findOneBy(Array('time' => $this->timeKeyFromTimestamp($timestamp), 'type' => 'total'));
        if (!$counter) {
            $counter = new ScheduledCounter($timestamp, "total", $this->time_interval);
            $counter_done = new ScheduledCounter($timestamp, "done", $this->time_interval);
            $this->doctrine->persist($counter_done);
        }

        //Get shard to place notification
        $shard = floor(($counter->getValue() + 1) / $this->bulk_size);

        $notification = new ScheduledTask($timestamp, $shard, $route, $message, $this->time_interval);
        $counter->setIncrementValue(1);

        //Save counter and notification
        $this->doctrine->useTTLOnFirstInsert(min(date("U") - $timestamp + $this->time_interval * 2, $this->max_ttl));
        $this->doctrine->persist($notification);
        $this->doctrine->persist($counter);
        $this->doctrine->flush();

        return true;
    }

    /** Get all notifications in 15 minutes interval (all nodes are calling this each minutes) */
    public function consumeShards($timeout = 60)
    {

        if ($already_sent_shard[$timekey . "_all"]) {
            return;
        }

        $start = date("U");

        $timestamp = date("U");
        $timekey = $this->timeKeyFromTimestamp($timestamp);

        //Get current counter state (if exists)
        $counter_repository = $this->doctrine->getRepository("Twake\Core:ScheduledCounter");
        $counter_total = $counter_repository->findOneBy(Array('time' => $timekey, 'type' => 'total'));
        $counter_done = $counter_repository->findOneBy(Array('time' => $timekey, 'type' => 'done'));
        //Nothing to do, no notifications
        if (!$counter_total || $counter_total->getValue() == 0
            || ($counter_done && $counter_total->getValue() <= $counter_done->getValue())) {
            return true;
        }

        $shards = []; //Get number of shards ex. shards 0, 1 and 2 for 235 notifications and 100 as bulk size
        for ($i = 0; $i <= floor($counter_total->getValue() / $this->bulk_size); $i++) {
            $shards[] = $i;
        }
        shuffle($shards);

        foreach ($shards as $shard) {

            if (date("U") - $start > $timeout) {
                return;
            }

            if ($already_sent_shard[$timekey . "_" . $shard]) {
                continue;
            }

            $tasks_repository = $this->doctrine->getRepository("Twake\Core:ScheduledTask");
            $tokenbdd = $tasks_repository->findOneBy(Array('time' => $timekey, 'shard' => $shard . '', 'id' => "token"));

            if (!$tokenbdd) {

                $token = base64_encode(bin2hex(random_bytes(32)));

                $tokenbdd = new ScheduledTask($timestamp, $shard, "", "", $this->time_interval);
                $tokenbdd->setId("token");
                $tokenbdd->setData($token);
                $this->doctrine->useTTLOnFirstInsert(60 * 60); //1 hour
                $this->doctrine->persist($tokenbdd);

                $this->queues->push("scheduled_notifications", [
                    "timekey" => $timekey,
                    "shard" => $shard,
                    "token" => $token
                ], [
                    "delay" => 2 //2 seconds time to update table
                ]);

                $this->doctrine->flush();

            } else {
                $already_sent_shard[$timekey . "_" . $shard] = true;
            }

        }

        $already_sent_shard[$timekey . "_all"] = true;

    }

    /** Consume shard task and ack once finished sent from consumeShards method and ignore duplicatas using token (sent on scheduled_notifications) */
    public function consumeShardsFromRabbitMQ()
    {

        $done = 0;

        $shards = $this->queues->oldConsume("scheduled_notifications", true, 1);

        foreach ($shards ?: [] as $shard) {

            $shard_message = $this->queues->getMessage($shard);

            $token = $shard_message["token"];
            $shard_number = $shard_message["shard"];
            $timekey = $shard_message["timekey"];

            $tasks_repository = $this->doctrine->getRepository("Twake\Core:ScheduledTask");
            /** @var ScheduledTask $tokenbdd */
            $tokenbdd = $tasks_repository->findOneBy(Array('time' => $timekey, 'shard' => $shard_number . "", 'id' => "token"));
            if ($tokenbdd && $tokenbdd->getData() === $token) {

                /** @var ScheduledTask[] $notifications */
                $notifications = $tasks_repository->findBy(Array('time' => $timekey, 'shard' => $shard_number . ""));
                foreach ($notifications as $notification) {
                    if ($notification->getId() == "token") {
                        continue;
                    }

                    $timestamp = $notification->getTimestamp();

                    $this->queues->push("scheduled_notifications_" . $notification->getRoute(), [
                        "message" => $notification->getData(),
                        "timestamp" => $timestamp
                    ], [
                        "delay" => $timestamp - date("U")
                    ]);

                }

                // Remove counters if task finished
                $counter_repository = $this->doctrine->getRepository("Twake\Core:ScheduledCounter");
                /** @var ScheduledCounter $counter_total */
                $counter_total = $counter_repository->findOneBy(Array('time' => $timekey, 'type' => 'total'));

                if ($counter_total) {
                    /** @var ScheduledCounter $counter_done */
                    $counter_done = $counter_repository->findOneBy(Array('time' => $timekey, 'type' => 'done'));
                    $final_value = $counter_total->getValue();
                    if ($counter_done) {
                        $final_value = $counter_done->getValue() + $this->bulk_size;
                        $counter_done->setIncrementValue($this->bulk_size);
                        $this->doctrine->persist($counter_done);
                        $this->doctrine->flush();
                    }

                    if ($final_value >= $counter_total->getValue()) {
                        $this->doctrine->remove($counter_total);
                        $this->doctrine->remove($counter_done);
                        $this->doctrine->flush();
                    }
                }

                // Remove shard
                $tasks_repository->removeBy(Array('time' => $timekey, 'shard' => $shard_number . ""));
                $this->doctrine->flush();

            }

            if ($tokenbdd) {
                $this->queues->ack("scheduled_notifications", $shard);
            }

            $done++;

        }

        return $done;

    }

    /** Get RabbitMQ notifications received at exact wanted time (sent on scheduled_notifications_[route]) */
    public function consume($route, $should_ack = false, $max_messages = 10, $message_processing = 60)
    {
        $list = $this->queues->oldConsume("scheduled_notifications_" . $route, $should_ack, $max_messages, $message_processing);
        return $list;
    }

    /** Ack a scheduled notification from any scheduled_notifications_[route] */
    public function ack($route, $message)
    {
        $this->queues->ack("scheduled_notifications_" . $route, $message);
    }

    public function getMessage($message)
    {
        return ($this->queues->getMessage($message) ?: [])["message"] ?: null;
    }

}
