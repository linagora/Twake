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
        $response = new Response();
        $this->get('driveupload.upload')->TestUpload($request, $response);
        return $response;
    }

    public function IndexAction(Request $request)
    {
        return new Response($this->render("TwakeDriveUploadBundle:Default:index.html.twig"));
    }

    public function DownloadfileAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.download')->TestDownload();
        return $response;
    }

}
