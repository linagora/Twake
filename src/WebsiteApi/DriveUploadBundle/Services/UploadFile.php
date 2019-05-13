<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleRequest;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleResponse;

use  WebsiteApi\DriveUploadBundle\Services\Resumable\Resumable;

use WebsiteApi\DriveUploadBundle\Services\Storage\EncryptionBag;

class UploadFile
{
    private $storagemanager;

    public function __construct($storagemanager)
    {
        $this->storagemanager = $storagemanager;
    }

    public function TestUpload($request, $response)
    {

        $request = new SimpleRequest($request);
        $response = new SimpleResponse($response);
        $name= bin2hex(random_bytes(20));
        $resumable = new Resumable($request, $response);
        $resumable->tempFolder = 'uploads';
        //$resumable->uploadFolder = 'uploads';
        $chunkFile = $resumable->process();


        $param_bag = new EncryptionBag($chunkFile,"testkey","AES");
        $this->storagemanager->write($param_bag);


   }
}