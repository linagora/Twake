<?php


namespace Twake\Drive\Controller;

use PHPUnit\Util\Json;
use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class Upload extends BaseController
{

    public function Preprocess(Request $request)
    {
        $identifier = $this->get('driveupload.upload')->preprocess($request, $this->getUser()->getId());
        return new JsonResponse(Array("identifier" => $identifier));
    }

    public function uploadFile(Request $request)
    {
        $current_user_id = $this->getUser()->getId();
        $res = $this->get('driveupload.upload')->upload($request, $response, $current_user_id);

        $this->get("administration.counter")->incrementCounter("total_files", 1);
        $this->get("administration.counter")->incrementCounter("total_files_size", intval($res["size"] / 1000));

        return new JsonResponse(Array("data" => Array("object" => $res)));
    }


    public function Preview(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.previewmanager')->generatePreviewFromFolder($request);
        return $response;
    }

}
