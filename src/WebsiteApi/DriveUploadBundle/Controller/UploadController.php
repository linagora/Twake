<?php


namespace WebsiteApi\DriveUploadBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UploadController extends Controller
{

    public function uploadFileAction(Request $request)
    {
        $current_user_id = $this->getUser()->getId();
        $res = $this->get('driveupload.upload')->upload($request, $response, $current_user_id);
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function downloadfileAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.download')->download();
        return $response;
    }

    public function PreprocessAction(Request $request)
    {
        $this->get('driveupload.upload')->preprocess($request);
        return new JsonResponse(Array("preprocess_finished"));
    }

    public function PreviewAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.previewmanager')->generatePreviewFromFolder($request);
        return $response;
    }

}
