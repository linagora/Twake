<?php

namespace Twake\Drive\Services\Resumable\Network;

use Common\Http\Response;

class SimpleResponse
{

    private $appresponse;

    public function __construct($response)
    {
        $this->appresponse = $response;
    }

    /**
     * @param $statusCode
     * @return mixed
     */
    public function header($statusCode)
    {
        if (200 == $statusCode) {
            return $this->appresponse->setStatusCode(Response::HTTP_OK);
        } else if (404 == $statusCode) {
            return $this->appresponse->setStatusCode(Response::HTTP_NOT_FOUND);
        }
        return $this->appresponse->setStatusCode(Response::HTTP_NO_CONTENT);
    }
}