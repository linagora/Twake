<?php

namespace Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class WebTestCaseExtended extends WebTestCase
{

    static $client;

    protected function getDoctrine()
    {
        if (!isset(WebTestCaseExtended::$client)) {
            WebTestCaseExtended::$client = static::createClient();
        }
        return WebTestCaseExtended::$client->getContainer()->get('doctrine.orm.entity_manager');
    }

    protected function get($service)
    {
        if (!isset(WebTestCaseExtended::$client)) {
            WebTestCaseExtended::$client = static::createClient();
        }
        return WebTestCaseExtended::$client->getContainer()->get($service);
    }

}
