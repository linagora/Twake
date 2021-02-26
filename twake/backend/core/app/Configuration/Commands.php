<?php

namespace Configuration;

class Commands
{
    public $commands = [
        "twake:schema:update" => "Twake\Core\Command\TwakeSchemaUpdateCommand",
        "twake:init" => "Twake\Core\Command\InitCommand",
        "twake:init_connector" => "BuiltInConnectors\Common\Command\InitConnector",
        "twake:update_services_status" => "Twake\Core\Command\UpdateServicesStatusCommand",
        "twake:routes" => "Twake\Core\Command\GetRoutesCommand",
        "twake:tasks_check_reminders" => "Twake\Tasks\Command\TaskReminderCheckerCommand",
        "twake:reindex" => "Twake\Core\Command\ReindexCommand",
        "twake:mapping" => "Twake\Core\Command\MappingCommand",
        "twake:calendar_check" => "Twake\Calendar\Command\ReminderCheckerCommand",
        "twake:node:push_mobile" => "Twake\Notifications\Command\NodePushNotifications",
        "twake:node:push_channel_activity" => "Twake\Discussion\Command\NodePushChannelActivity",
        "twake:mails_queue" => "Twake\Core\Command\MailsQueueCommand",
        "twake:notifications_mail" => "Twake\Notifications\Command\NotificationMailCommand",
        "twake:preview_worker" => "Twake\Drive\Command\DrivePreviewCommand",
        "twake:scheduled_notifications_consume_timetable" => "Twake\Core\Command\ScheduledNotificationsConsumeTimetable",
        "twake:scheduled_notifications_consume_shard" => "Twake\Core\Command\ScheduledNotificationsConsumeShard",
    ];

}
