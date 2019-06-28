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

        $current_user = $this->getUser();
        if(!(isset($current_user)))
        {
            $current_user_id = "d8a1136c-544e-11e9-9f85-0242ac120005";
        }
        else
        {
            $current_user_id= $current_user->getId();
        }
        //$current_user_id= $current_user->getId();
        $response = new Response();
        $this->get('driveupload.upload')->TestUpload($request, $response,$current_user_id);
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

    public function PreprocessAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.upload')->PreProcess($request);
        return $response;
    }

    public function PreviewAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.previewmanager')->generatePreviewFromFolder($request);
        return $response;
    }

}
