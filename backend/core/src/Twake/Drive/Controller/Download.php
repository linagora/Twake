<?php


namespace Twake\Drive\Controller;

use PHPUnit\Util\Json;
use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Download extends BaseController
{

    public function downloadfile(Request $request)
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

        @$response = $this->get('driveupload.download')->download($workspace_id, $files_ids, $download, $versionId);
        if ($response === true) {
            return;
        }

        return new Response($data);

    }

}
