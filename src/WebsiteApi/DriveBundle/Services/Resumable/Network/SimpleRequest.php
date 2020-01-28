<?php

namespace WebsiteApi\DriveBundle\Services\Resumable\Network;

use Symfony\Component\HttpFoundation\Request;

class SimpleRequest
{
    public $symfonyrequest;

    public function __construct($request)
    {
        $this->symfonyrequest = $request;
    }

    /**
     * @param $type get/post
     * @return boolean
     */
    public function is($type)
    {
        switch (strtolower($type)) {
            case 'post':
                return isset($_POST) && !empty($_POST);
                break;
            case 'get':
                return isset($_GET) && !empty($_GET);
                break;
        }
        return false;
    }

    /**
     * @param $requestType GET/POST
     * @return mixed
     */
    public function data($requestType)
    {
        switch (strtolower($requestType)) {
            case 'post':
                return isset($_POST) ? $_POST : array();
                break;
            case 'get':
                return isset($_GET) ? $_GET : array();
                break;
        }
        return array();
    }

    /**
     * @return FILES data
     */
    public function file()
    {

        if (!isset($_FILES) || empty($_FILES)) {
            return array();
        }
        $files = array_values($_FILES);
        return array_shift($files);
    }
}