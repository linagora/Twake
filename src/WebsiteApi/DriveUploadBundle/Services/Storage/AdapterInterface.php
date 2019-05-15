<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

interface AdapterInterface{

    public function read($chunkFile,$param_bag);

    public function write($chunkFile,$param_bag);

}