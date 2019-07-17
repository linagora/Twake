<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleRequest;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleResponse;

class UploadFile
{
    private $resumable;

    public function __construct($resumable, $parameter_drive_salt)
    {
        $this->resumable = $resumable;
        $this->parameter_drive_salt = $parameter_drive_salt;
    }

    public function preprocess($request)
    {
        $workspace_id = $request->request->get("workspace_id", "");
        $identifier = $request->request->all()["identifier"];
        $name = $request->request->all()["name"];
        $extension = $request->request->all()["extension"];
        $this->resumable->createObject($workspace_id, $identifier, $name, $extension);
    }

    public function upload($request, $response, $current_user)
    {
        $request = new SimpleRequest($request);
        $response = new SimpleResponse($response);
        $this->resumable->updateParam($request, $response, $this->parameter_drive_salt);
        $res = $this->resumable->process($current_user);
        if (is_array($res)) {
            return $res;
        }
   }
}