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

    public function ZipDownloadAction(Request $request)
    {
        //$current_user_id = $this->getUser()->getId();
        //$files_id = Array("be8a46cc-d943-11e9-939c-0242ac1d0005","b9dfea28-d943-11e9-a143-0242ac1d0005");
        //$files_id = Array("be8a46cc-d943-11e9-939c-0242ac1d0005");
        //parent id as a folder
        $files_id = Array("01292620-d92a-11e9-a0ae-0242ac1d0005");
        //$files_id = Array("36b368e6-cb38-11e9-ab11-0242ac1d0005");
        $res = $this->get('driveupload.download')->zipDownload("52a05d64-c356-11e9-8117-0242ac1d0005",$files_id,true,0);

        //return new JsonResponse(Array("data" => Array("object" => $res)));
        return new JsonResponse("hello");
    }


    public function PreviewAction(Request $request)
    {
        $response = new Response();
        $this->get('driveupload.previewmanager')->generatePreviewFromFolder($request);
        return $response;
    }

}
