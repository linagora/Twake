<?php

use App\App;
function getDefaultHeaders()
{
    if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN'], true);
    }
    header('Access-Control-Allow-Headers: ' . 'Content-Type, *', true);
    header('Access-Control-Allow-Credentials: true', true);
    header('Access-Control-Allow-Methods: GET, POST', true);
    header('Access-Control-Max-Age: 600', true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {

    try {

        require_once __DIR__ . '/../vendor/autoload.php';
        require_once __DIR__ . '/../app/App.php';

        $app = new App();

        $time = microtime(true);
        if (php_sapi_name() != "cli") {
            $app->run();
        }
        error_log("run=" . (microtime(true) - $time));

        return $app;

    } catch (\Exception $e) {
        getDefaultHeaders();
    }

} else {

    getDefaultHeaders();

}