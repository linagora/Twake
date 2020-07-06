<?php

namespace Common;

use App\App;

class CommandsManager
{

    public $app;
    public $commands = [];

    public function __construct($app, $commands)
    {
        $this->app = $app;
        $this->commands = $commands;
    }

    public function run()
    {
        array_shift($_SERVER["argv"]);
        $command = array_shift($_SERVER["argv"]);
        $arguments = $_SERVER["argv"];

        if ($command && $this->commands[$command]) {

            $this->execute($command, $arguments);

        } else {
            if ($command) {
                error_log("Command \e[0;31;42m'" . $command . "'\e[0m was not found.");
            }
            $this->help();
        }

    }

    public function execute($command, $arguments)
    {
        if (!isset($this->commands[$command])) {
            return;
        }

        $command = new $this->commands[$command]($this->app);

        $command->executeFromManager();

    }

    private function help()
    {

        error_log("\nAll commands:");
        foreach ($this->commands as $name => $command) {
            error_log("\e[0;31;42m" . $name . "\e[0m");
        }
        error_log("\n");

    }

}
