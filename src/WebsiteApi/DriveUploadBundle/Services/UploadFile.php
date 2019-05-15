<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleRequest;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleResponse;

class UploadFile
{
    private $resumable;

    public function __construct($resumable)
    {
        $this->resumable = $resumable;
    }

    public function TestUpload($request, $response)
    {

//        @unlink("uploads/74726574343666676466617a65.chunk_1");
//        @unlink("uploads/74726574343666676466617a65.chunk_2");

        $request = new SimpleRequest($request);
        $response = new SimpleResponse($response);
        //$name= bin2hex(random_bytes(20));
        $this->resumable->Updateparam($request,$response);
        $chunkFile = $this->resumable->process();

        //error_log(print_r($chunkFile,true));




   }
}