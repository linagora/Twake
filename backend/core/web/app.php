<?php

use App\App;


if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {


    require_once __DIR__ . '/../vendor/autoload.php';
    require_once __DIR__ . '/../app/App.php';


    $silex_app = new Silex\Application();

    $app = new App($silex_app);

    if (php_sapi_name() != "cli") {
        $app->run();
    }

    return $app;

} else {

    if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN'], true);
    }
    header('Access-Control-Allow-Headers: ' . 'Content-Type, *', true);
    header('Access-Control-Allow-Credentials: true', true);
    header('Access-Control-Allow-Methods: GET, POST', true);
    header('Access-Control-Max-Age: 600', true);

}