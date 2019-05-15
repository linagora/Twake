<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleRequest;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleResponse;
use WebsiteApi\DriveUploadBundle\Services\Storage\EncryptionBag;


class DownloadFile
{
    private $storagemanager;
    private  $doctrine;

    public function __construct($storagemanager, $doctrine)
    {
        $this->storagemanager = $storagemanager;
        $this->doctrine = $doctrine;
    }

    public function TestDownload()
    {

        $uploadstate = $this->doctrine->getRepository("TwakeDriveUploadBundle:UploadState")->findBy(Array());
        //var_dump(count($uploadstate));
        foreach ($uploadstate as $upload){
            $this->doctrine->remove($upload);
        }
        $this->doctrine->flush();

//        $uploadstate = $this->doctrine->getRepository("TwakeDriveUploadBundle:UploadState")->findOneBy(Array("filename" => "jack.png"));
//        var_dump($uploadstate);

//        $param_bag = new EncryptionBag("testkey","let's try a salt", "AES");
//        $chunkFile = "74726574343666676466617a65.chunk_1";
//        $this->storagemanager->read($chunkFile,$param_bag);

    }
}