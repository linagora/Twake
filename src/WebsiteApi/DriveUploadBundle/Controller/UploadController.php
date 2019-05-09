<?php


namespace WebsiteApi\DriveUploadBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UploadController extends Controller
{

    public function UploadfileAction(Request $request)
    {

        $this->get('driveupload.upload')->TestUpload();

        return new Response("Hello !");

    }

}
