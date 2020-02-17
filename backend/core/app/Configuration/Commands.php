<?php

namespace Configuration;

class Commands
{
    public $commands = [
        "twake:schema:update" => "Twake\Core\Command\TwakeSchemaUpdateCommand",
        "twake:init" => "Twake\Core\Command\InitCommand",
        "twake:tasks_check_reminders" => "Twake\Tasks\Command\TaskReminderCheckerCommand",
        "twake:daily" => "Twake\Core\Command\DailyCommand",
        "twake:reindex" => "Twake\Core\Command\ReindexCommand",
        "twake:mapping" => "Twake\Core\Command\MappingCommand",
        "twake:calendar_check" => "Twake\Calendar\Command\ReminderCheckerCommand",
        "twake:notifications_queue" => "Twake\Notifications\Command\NotificationQueueCommand",
        "twake:notifications_mail" => "Twake\Notifications\Command\NotificationMailCommand",
        "twake:preview_worker" => "Twake\Drive\Command\DrivePreviewCommand"
    ];

}