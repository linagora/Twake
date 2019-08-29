<?php


namespace WebsiteApi\DriveUploadBundle\Controller;

use PHPUnit\Util\Json;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UploadController extends Controller
{

    public function downloadfileAction(Request $request)
    {

        $data = Array(
            "errors" => Array()
        );

        if ($request->query->has("workspace_id")) {
            $data = $request->query;
        } else {
            $data = $request->request;
        }

        $workspace_id = $data->get("workspace_id", 0);
        $files_ids = $data->get("element_id", 0);
        $download = $data->get("download", 1);
        $versionId = $data->get("version_id", 0);
        $public_access_key = $data->get("public_access_key", false);

        if ($data->has("elements_id")) {
            $files_ids = explode(",", $data->get("elements_id", ""));
        }

        //TODO check access to this file or set of files

        $this->get("administration.counter")->incrementCounter("total_files_downloaded", 1);


        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();
        @$response = $this->get('driveupload.download')->download($workspace_id, $files_ids, $download, $versionId, $fileSystem);
        if ($response === true) {
            return;
        }

        return new JsonResponse($data);

    }

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
