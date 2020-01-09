<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

use WebsiteApi\DriveUploadBundle\Entity\UploadState;

interface AdapterInterface
{

    public function read($destination, $chunkNo, $param_bag, UploadState $uploadState, &$zip, $zip_prefixe);

    public function write($chunkFile, $chunkNo, $param_bag, UploadState $uploadState);

    public function streamModeIsAvailable();

}