<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

use WebsiteApi\DriveUploadBundle\Entity\UploadState;

interface AdapterInterface{

    public function read($chunkFile, $chunkNo, $param_bag, UploadState $uploadState);

    public function write($chunkFile, $chunkNo, $param_bag, UploadState $uploadState);

}