<?php

namespace Twake\Drive\Services\Storage;

use Twake\Drive\Entity\UploadState;

interface AdapterInterface
{

    public function read($destination, $chunkNo, $param_bag, UploadState $uploadState, &$zip, $zip_prefixe);

    public function write($chunkFile, $chunkNo, $param_bag, UploadState $uploadState);

    public function streamModeIsAvailable();

}