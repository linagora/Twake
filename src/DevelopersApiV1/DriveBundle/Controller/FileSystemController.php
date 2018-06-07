<?php

namespace DevelopersApiV1\DriveBundle\Controller;

use phpDocumentor\Reflection\Types\Array_;
use PHPUnit\Util\Json;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Finder\Finder;

class FileSystemController extends Controller
{
    public function addObjectAction(Request $request, $workspace_id)
    {
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write");


        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $content = $this->get("api.v1.check")->get($request);;
        $filename = isset($content["name"])?$content["name"]:"Untitled";
        $directory = isset($content["parent_id"])?$content["parent_id"]:0;
        $isDirectory = isset($content["is_directory"])?$content["is_directory"]:false;
        $detached_file = isset($content["detached"])?$content["detached"]:false;

        $f = $this->get("app.drive.FileSystem")->create($workspace_id,$directory, $filename, $content = "", $isDirectory, $detached_file);

        if ($f == true){
            return new JsonResponse("true");
        }
        return new JsonResponse();
    }


    public function deleteObjectAction(Request $request,$id,$workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $test = $this->get("app.drive.FileSystem")->canAccessTo($id,$workspace_id,$user = null);
        if (!$test){
            return new JsonResponse("");
        }
        $supp = $this->get("app.drive.FileSystem")->delete($id, $flush = true);

        if ($supp == true){
            return new JsonResponse("true");
        }

        return new JsonResponse();
    }


    public function trashObjectAction(Request $request, $id, $workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $test = $this->get("app.drive.FileSystem")->canAccessTo($id,$workspace_id,$user = null);
        if (!$test){
            return new JsonResponse("");
        }
        $supp = $this->get("app.drive.FileSystem")->toTrash($id);

        if ($supp == true){
            return new JsonResponse("true");
        }

        return new JsonResponse();
    }


    public function restoreObjectAction(Request $request, $id, $workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $test = $this->get("app.drive.FileSystem")->canAccessTo($id,$workspace_id,$user = null);
        if (!$test){
            return new JsonResponse("");
        }
        $restore = $this->get("app.drive.FileSystem")->restore($id);

        if($restore == true){
            return new JsonResponse("true");
        }

        return new JsonResponse();
    }


    public function restoreTrashAction(Request $request,$workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $restoreTrash = $this->get("app.drive.FileSystem")->restoreTrash($workspace_id);

        if($restoreTrash == true){
            return new JsonResponse("true");
        }
        return new JsonResponse();

    }


    public function emptyTrashAction(Request $request, $workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $empty = $this->get("app.drive.FileSystem")->emptyTrash($workspace_id);

        if($empty == true){
            return new JsonResponse("true");
        }
        return new JsonResponse();
    }


    public function selectInfoAction($info){

        $response["id"] = $info["id"];
        $response["name"] = $info["name"];
        $response["description"] = $info["description"];
        $response["size"] = $info["size"];
        $response["added"] = $info["added"];
        $response["parent_id"] = $info["parent"];
        $response["modified"] = $info["modified"];
        $response["is_directory"] = $info["isDirectory"];
        $response["extension"] = $info["extension"];
        $response["workspace_id"] = $info["groupId"];
        $response["detached"] = $info["detached"];
        $response["shared"] = $info["shared"];

        return $response;
    }


    public function getInfoAction(Request $request,$workspace_id,$id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $info = $this->get("app.drive.FileSystem")->getInfos($workspace_id, $id, $forceAccess = false);

        $infoLight = $this->selectInfoAction($info);
        if($info !=false){
            return new JsonResponse($infoLight);
        }
        return new JsonResponse();
    }


    public function contentAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $download = $this->get("app.drive.FileSystem")->download($workspace_id,$id,false);

        if($download ==false){
            return new JsonResponse("");
        }
        var_dump("test2");
        return new JsonResponse("test");
    }


    public function setContentAction(Request $request, $workspace_id, $id){

        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $data = $this->get("api.v1.check")->get($request);
        $content = isset($data["content"])?$data["content"]:null;
        $url =isset($data["url"])?$data["url"]:null;

        $canAllow = $this->get("app.drive.FileSystem")->canAccessTo($id,$workspace_id,$user = null);

        if (!$canAllow){
            return new JsonResponse("");
        }

        if ($content===null && $url === null){
            return new JsonResponse("");
        }

        if ($url === null ){
            $setContent = $this->get("app.drive.FileSystem")->setRawContent($id, $content, $newVersion = false);
            return new JsonResponse($setContent);
        }

        if ($content === null ){

            //IMPORTANT ! Disable local files !!!
            if (strpos($url, "http://") !== false) {
                $url = "http://" . str_replace("http://", "", $url);
            } else {
                $url = "https://" . str_replace("https://", "", $url);
            }

            if (!$url || !$this->get("app.drive.FileSystem")->canAccessTo($id, $workspace_id, null)) {
                $data["errors"][] = 3004;
            } else {

                $content = file_get_contents($url);
                $this->get("app.drive.FileSystem")->setRawContent($id, $content);

            }

            return new JsonResponse($data);
        }
    }

    public function shareObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $content = $this->get("api.v1.check")->get($request);
        $targetgroupId = isset($content["target_workspace"])?$content["target_workspace"]:$workspace_id;

        $share = $this->get("app.drive.FileSystem")->share($workspace_id, $id, $targetgroupId);

        if ($share == false){
            return new JsonResponse("Pb");
        }

        return new JsonResponse("....");
    }


    public function unshareObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $content = $this->get("api.v1.check")->get($request);
        $targetgroupId = isset($content["target_workspace"])?$content["target_workspace"]:$workspace_id;

        $unshare = $this->get("app.drive.FileSystem")->unshare($workspace_id, $id, $targetgroupId, false);

        if ($unshare == false){
            return new JsonResponse("Pb");
        }

        return new JsonResponse("..");
    }

    public function renameObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $test = $this->get("app.drive.FileSystem")->canAccessTo($id,$workspace_id,$user = null);
        if (!$test){
            return new JsonResponse("");
        }

        $infos = $this->get("app.drive.FileSystem")->getInfos($workspace_id, $id, $forceAccess = false);
        $oldFileName = $infos["name"];
        $oldDescription = $infos["description"];
        $labels = isset($infos["cache"]["labels"])?$infos["cache"]["labels"]:Array();
        //var_dump($labels);
        var_dump($infos["cache"]["labels"]);

        $content = $this->get("api.v1.check")->get($request);
        $newFileName = isset($content["new_file_name"])?$content["new_file_name"]:$oldFileName;

        $rename = $this->get("app.drive.FileSystem")->rename($id, $newFileName, $oldDescription, $labels);

        if (!$rename){
            return new JsonResponse("");
        }

        return new JsonResponse("..");
    }

    public function searchObjectAction(Request $request,$workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $content = $this->get("api.v1.check")->get($request);
        $query = isset($content["query"])?$content["query"]:"";

        $search = $this->get("app.drive.FileSystem")->search($workspace_id, $query, 0, 20);

        if ($search == Array()){
            return new JsonResponse("List vide");
        }

        if ($search == false){
            return new JsonResponse("retourne false");
        }
        $response = Array();
        foreach ($search as $element){
            $infos = $this->get("app.drive.FileSystem")->getInfos($workspace_id, $element, false);
            $selectedInfos = $this->selectInfoAction($infos);
            array_push($response,$selectedInfos);
        }

        return new JsonResponse($response);
    }


    public function listFilesAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $test = $this->get("app.drive.FileSystem")->canAccessTo($id,$workspace_id,$user = null);
        if (!$test){
            return new JsonResponse("");
        }

        $listFiles = $this->get("app.drive.FileSystem")->listDirectory($workspace_id, $id, false);

        if($listFiles == false){
            return new JsonResponse("Pb");
        }

        $response = Array();
        foreach ($listFiles as $file){
            $infos = $this->get("app.drive.FileSystem")->getInfos($workspace_id, $file, false);
            $selectedInfos = $this->selectInfoAction($infos);
            array_push($response,$selectedInfos);
        }
        return new JsonResponse($response);
    }


    public function moveObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse("");
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write");

        if (!$isAllowedTo){
            return new JsonResponse("..");
        }

        $test = $this->get("app.drive.FileSystem")->canAccessTo($id,$workspace_id,$user = null);
        if (!$test){
            return new JsonResponse("");
        }

        $content = $this->get("api.v1.check")->get($request);
        $newDirectory = isset($content["new_directory"])?$content["new_directory"]:$workspace_id;

        $move = $this->get("app.drive.FileSystem")->move($id, $newDirectory, $workspace_id);
        if($move == false){
            return new JsonResponse("Pb");
        }

        return new JsonResponse("Tout va bien !");
    }
}
