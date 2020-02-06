<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/App.php';

use App\App;

$silex_app = new Silex\Application();
$silex_app['debug'] = true;

$app = new App($silex_app);
$silex_app->run();