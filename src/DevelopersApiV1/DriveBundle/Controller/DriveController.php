<?php


namespace DevelopersApiV1\DriveBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DriveController extends Controller
{

    public function saveAction (Request $request){
        $capabilities = ["drive_create"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $object = $request->request->get("object", null);
        $file_uploaded = $request->request->get("file_url", null);

        if (!$file_uploaded) {
            $file_uploaded = $_FILES["file"];
        }

        $user = null;
        if (isset($object["sender"])) {
            $user = $this->get("app.users")->getById($object["sender"], true);
        }

        try {
            $object = $this->get("app.drive")->save($object,Array() ,$user,$application, $file_uploaded);
        } catch (\Exception $e) {
            $object = false;
        }

        if (!$object) {
            return new JsonResponse(Array("error" => "unknown error or malformed query."));
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

        return new JsonResponse(Array("object" => $object));


    }

    public function findAction(Request $request)
    {
        $privileges = ["workspace_drive"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $user_id = null;
        $workspace_id = $request->request->get("workspace_id", null);
        $element_id = $request->request->get("element_id", null);

        if ($workspace_id && $element_id) {
            $object = $this->get("app.drive")->find(
                Array("workspace_id" => $workspace_id, "element_id" => $element_id), null);
        }
        else{
            return new JsonResponse(Array("error" => "unknown error or malformed query."));
        }

        return new JsonResponse(Array("object" => $object));
    }

    public function getListAction(Request $request)
    {
        $privileges = ["drive_list"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $user_id = null;
        $workspace_id = $request->request->get("workspace_id", null);
        $directory_id = $request->request->get("directory_id", null);

        if ($workspace_id && $directory_id) {
            $objects = $this->get("app.drive")->get(
                Array("workspace_id" => $workspace_id, "directory_id" => $directory_id, "trash" => false), null);
        } else {
            return new JsonResponse(Array("error" => "unknown error or malformed query."));
        }

        $res = [];
        foreach ($objects as $object) {
            if ($object["is_directory"]) {
                $res[] = $object;
            }
        }

        return new JsonResponse(Array("data" => $res));
    }

    public function downloadAction(Request $request ){
        $privileges = ["workspace_drive"];
        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $workspace_id = $request->request->get("workspace_id", null);
        $fileId = $request->request->get("file_id", null);

        $fileSystem = $this->get("app.drive.adapter_selector")->getFileSystem();
        @$response = $fileSystem->download($workspace_id, $fileId, true);

        return $response;
    }



}