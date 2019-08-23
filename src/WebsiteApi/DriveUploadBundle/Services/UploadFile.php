<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleRequest;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleResponse;

class UploadFile
{
    private $resumable;

    public function __construct($resumable)
    {
        $this->resumable = $resumable;
    }

    public function preprocess($request, $current_user_id)
    {
        $workspace_id = $request->request->get("workspace_id", "");
        $name = $request->request->all()["name"];
        $extension = $request->request->all()["extension"];
        return $this->resumable->createObject($workspace_id, $name, $extension, $current_user_id);
    }

    public function upload($request, $response, $current_user)
    {
        $request = new SimpleRequest($request);
        $response = new SimpleResponse($response);
        $this->resumable->updateParam($request, $response);
        $res = $this->resumable->process($current_user);
        if (is_array($res)) {
            return $res;
        }
    }

    public function uploadDirectly($file_or_url, $object, $options, $current_user_id)
    {
        $workspace_id = $object["workspace_id"];
        $name = $object["name"];
        if (!isset($object["extension"]) || !$object["extension"]) {
            preg_match("/(.*)(\.[a-zA-Z0-9]+)+$/i", $name, $matches);
            $extension = isset($matches[2]) ? $matches[2] : "";
        } else {
            $extension = $object["extension"];
        }

        $identifier = $this->resumable->createObject($workspace_id, $name, $extension, $current_user_id);;

        if ($identifier) {
            $res = $this->resumable->handleChunk($file_or_url, $object["name"], 0, $identifier, 1, 1, $object);
            if (is_array($res)) {
                return $res;
            }
        }

        return null;

    }

}