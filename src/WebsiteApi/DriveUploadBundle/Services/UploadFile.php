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
    private $doctrine;

    public function __construct($storagemanager,$doctrine)
    {
        $this->storagemanager = $storagemanager;
        $this->doctrine = $doctrine;

    }

    public function TestUpload($request, $response)
    {

//        @unlink("uploads/74726574343666676466617a65.chunk_1");
//        @unlink("uploads/74726574343666676466617a65.chunk_2");


        $request = new SimpleRequest($request);
        $response = new SimpleResponse($response);
        //$name= bin2hex(random_bytes(20));
        $resumable = new Resumable($request, $response, $this->doctrine);
        $resumable->tempFolder = 'uploads';
        //$resumable->uploadFolder = 'uploads';
        $chunkFile = $resumable->process();

        //error_log(print_r($chunkFile,true));

        $param_bag = new EncryptionBag("testkey","let's try a salt", "AES");
        $this->storagemanager->write($chunkFile,$param_bag);


   }
}