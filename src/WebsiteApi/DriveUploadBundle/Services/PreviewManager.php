<?php

namespace WebsiteApi\DriveUploadBundle\Services;

use WebsiteApi\DriveUploadBundle\Services\DrivePreview;

class PreviewManager
{
    private $previews;
    private $preview_service;

    public function __construct($preview_service, $previews)
    {
        $this->previews = $previews;
        $this->preview_service = $preview_service;
    }

    public function generatePreviewFromFolder()
    {
        //TODO
    }

}
