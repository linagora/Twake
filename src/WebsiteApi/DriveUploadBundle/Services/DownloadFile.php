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

    public function download($workspace_id, $files_ids, $download, $versionId)
    {


        $this->resumable->downloadFile();
    }
}