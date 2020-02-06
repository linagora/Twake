<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/App.php';

use App\App;

$silex_app = new Silex\Application();

$app = new App($silex_app);

if (php_sapi_name() != "cli") {
    $app->run();
}

return $app;