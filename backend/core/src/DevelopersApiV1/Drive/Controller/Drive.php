<?php


namespace DevelopersApiV1\Drive\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Drive extends BaseController
{

    public function save(Request $request)
    {
        $capabilities = ["drive_save"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $object = $request->request->get("object", null);
        $file_uploaded = $request->request->get("file_url", null);

        if (!$file_uploaded) {
            $file_uploaded = $_FILES["file"];
        }

        $user = null;
        if (isset($object["sender"])) {
            $user = $this->get("app.users")->getById($object["sender"], true)->getId();
        }

        try {
            $options = Array("application_id" => $application->getId());
            if ($file_uploaded) {
                //If object[_once_new_version] is set a new version is added
                $object = $this->get('driveupload.upload')->uploadDirectly($file_uploaded, $object, $options, $user);
            } else {
                $object = $this->get("app.drive")->save($object, $options, $user, $upload_data);
            }
        } catch (\Exception $e) {
            $object = false;
        }

        if (!$object) {
            return new Response(Array("error" => "unknown error or malformed query."));
        }

        if ($object) {

            $event = Array(
                "client_id" => "system",
                "action" => "save",
                "object_type" => "",
                "object" => $object
            );
            $this->get("app.websockets")->push("drive/" . $object["workspace_id"] . "/" . $object["parent_id"], $event);

        }

        $this->get("administration.counter")->incrementCounter("total_api_drive_operation", 1);

        return new Response(Array("object" => $object));


    }

    public function remove(Request $request)
    {
        $capabilities = ["drive_remove"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $options = Array("application_id" => $application->getId());
        $object = $request->request->get("object", null);

        $res = $this->get("app.drive")->remove($object, $options, null);
        if (!$res) {
            return new Response(Array("error" => "unknown error or malformed query."));
        } else {

            $event = Array(
                "client_id" => "system",
                "action" => "remove",
                "object_type" => "",
                "front_id" => $res["front_id"]
            );
            $this->get("app.websockets")->push("drive/" . $res["workspace_id"] . "/" . $res["parent_id"], $event);

        }

        $this->get("administration.counter")->incrementCounter("total_api_drive_operation", 1);

        return new Response(Array("object" => $res));


    }

    public function find(Request $request)
    {
        $privileges = ["workspace_drive"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $workspace_id = $request->request->get("workspace_id", null);
        $element_id = $request->request->get("element_id", null);

        $user = null;
        if (isset($object["user_id"])) {
            $user = $this->get("app.users")->getById($object["user_id"], true);
            if (!$user) {
                return null;
            }
        }

        if ($workspace_id && $element_id) {
            $object = $this->get("app.drive")->find(
                Array("workspace_id" => $workspace_id, "element_id" => $element_id), $user);
        } else {
            return new Response(Array("error" => "unknown error or malformed query."));
        }

        $this->get("administration.counter")->incrementCounter("total_api_drive_operation", 1);

        return new Response(Array("object" => $object));
    }

    public function getList(Request $request)
    {
        $privileges = ["drive_list"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $user_id = null;
        $workspace_id = $request->request->get("workspace_id", null);
        $directory_id = $request->request->get("directory_id", null);

        if ($workspace_id && $directory_id) {
            $objects = $this->get("app.drive")->get(
                Array("workspace_id" => $workspace_id, "directory_id" => $directory_id, "trash" => false), null);
        } else {
            return new Response(Array("error" => "unknown error or malformed query."));
        }

        $res = [];
        foreach ($objects as $object) {
            $res[] = $object;
        }

        $this->get("administration.counter")->incrementCounter("total_api_drive_operation", 1);

        return new Response(Array("data" => $res));
    }

    public function download(Request $request)
    {

        $privileges = ["workspace_drive"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $workspace_id = $request->request->get("workspace_id", null);
        $fileId = $request->request->get("file_id", null);

        @$response = $this->get('driveupload.download')->download($workspace_id, $fileId, true, null);

        $this->get("administration.counter")->incrementCounter("total_api_drive_operation", 1);

        return $response;
    }


}