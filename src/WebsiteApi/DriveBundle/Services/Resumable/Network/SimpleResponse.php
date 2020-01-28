<?php

namespace WebsiteApi\DriveBundle\Services\Resumable\Network;

use Symfony\Component\HttpFoundation\Response;

class SimpleResponse
{

    private $symfonyresponse;

    public function __construct($response)
    {
        $this->symfonyresponse = $response;
    }

    /**
     * @param $statusCode
     * @return mixed
     */
    public function header($statusCode)
    {
        if (200 == $statusCode) {
            return $this->symfonyresponse->setStatusCode(Response::HTTP_OK);
        } else if (404 == $statusCode) {
            return $this->symfonyresponse->setStatusCode(Response::HTTP_NOT_FOUND);
        }
        return $this->symfonyresponse->setStatusCode(Response::HTTP_NO_CONTENT);
    }
}