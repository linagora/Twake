<?php


namespace WebsiteApi\DriveBundle\Controller;

use PHPUnit\Util\Json;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UploadController extends Controller
{

    public function PreprocessAction(Request $request)
    {
        $identifier = $this->get('driveupload.upload')->preprocess($request, $this->getUser()->getId());
        return new JsonResponse(Array("identifier" => $identifier));
    }

    public function uploadFileAction(Request $request)
    {
        $current_user_id = $this->getUser()->getId();
        $res = $this->get('driveupload.upload')->upload($request, $response, $current_user_id);

        $this->get("administration.counter")->incrementCounter("total_files", 1);
        $this->get("administration.counter")->incrementCounter("total_files_size", intval($res["size"] / 1000));

        return new JsonResponse(Array("data" => Array("object" => $res)));
    }


    public function PreviewAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.previewmanager')->generatePreviewFromFolder($request);
        return $response;
    }

}
