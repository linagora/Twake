<?php

namespace Configuration;

class Commands
{
    public $commands = [
        "twake:tasks_check_reminders" => "Twake\Tasks\Command\TaskReminderCheckerCommand",
        "twake:schema:update" => "Twake\Core\Command\TwakeSchemaUpdateCommand"
    ];

}