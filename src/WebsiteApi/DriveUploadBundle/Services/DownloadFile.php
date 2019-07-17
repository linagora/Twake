<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;


class DownloadFile
{
    private $resumable;

    public function __construct($resumable)
    {
        $this->resumable = $resumable;
    }

    public function download()
    {
        $this->resumable->downloadFile();
    }
}