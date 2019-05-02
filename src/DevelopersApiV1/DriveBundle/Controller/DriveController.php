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
        return new JsonResponse(Array("object" => $object));


    }

}