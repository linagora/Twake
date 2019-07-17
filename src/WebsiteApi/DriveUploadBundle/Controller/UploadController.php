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
            $is_v2 = $request->query->get("v2", false);
            $workspace_id = $request->query->get("workspace_id", 0);
            $files_ids = $request->query->get("element_id", 0);
            $download = $request->query->get("download", 1);
            $versionId = $request->query->get("version_id", 0);
            $public_access_key = $request->query->get("public_access_key", false);

            if ($request->query->has("elements_id")) {
                $files_ids = explode(",", $request->query->get("elements_id", ""));
            }
        } else {
            $is_v2 = $request->query->get("v2", false);
            $workspace_id = $request->request->get("workspace_id", 0);
            $files_ids = $request->request->get("element_id", 0);
            $download = $request->request->get("download", 1);
            $versionId = $request->request->get("version_id", 0);
            $public_access_key = $request->request->get("public_access_key", false);

            if ($request->request->has("elements_id")) {
                $files_ids = explode(",", $request->request->get("elements_id", ""));
            }
        }

        //TODO check access to this file or set of files

        if (!$is_v2) {
            $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();
            @$response = $fileSystem->download($workspace_id, $files_ids, $download, $versionId);
            return $response;
        } else {
            @$response = $this->get('driveupload.download')->download($workspace_id, $files_ids, $download, $versionId);
            return $response;
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
        return new JsonResponse(Array("data" => Array("object" => $res)));
    }

    public function PreviewAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.previewmanager')->generatePreviewFromFolder($request);
        return $response;
    }

}
