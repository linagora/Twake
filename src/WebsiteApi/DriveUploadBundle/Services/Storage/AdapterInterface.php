<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

interface AdapterInterface{

    public function read();

    public function write($param_bag);

}