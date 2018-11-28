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
    public function addObjectAction(Request $request, $workspace_id){
        $check = $this->get("api.v1.check")->check($request);
        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write",$workspace_id);
        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);;
        $filename = isset($content["name"])?$content["name"]:"Untitled";
        $directory = isset($content["parent_id"])?$content["parent_id"]:0;
        $isDirectory = isset($content["is_directory"])?$content["is_directory"]:false;
        $detached_file = isset($content["detached"])?$content["detached"]:false;
        $url = isset($content["url"])?$content["url"]:null;

        $f = $this->get("app.drive.adapter_selector")->getFileSystem()->create($workspace_id, $directory, $filename, $content = "", $isDirectory, $detached_file, $url);
        if ($f == false ){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2000));
        }

        $response = $this->get("app.drive.adapter_selector")->getFileSystem()->getInfos($workspace_id, $f, false);
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$response));
    }


    public function deleteObjectAction(Request $request,$id,$workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $test = $this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, $user = null);
        if (!$test){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
        }
        $supp = $this->get("app.drive.adapter_selector")->getFileSystem()->delete($id, $flush = true);

        if ($supp != true){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2002));
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }


    public function trashObjectAction(Request $request, $id, $workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $test = $this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, $user = null);
        if (!$test){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
        }
        $supp = $this->get("app.drive.adapter_selector")->getFileSystem()->toTrash($id);

        if ($supp != true){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2003));
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }


    public function restoreObjectAction(Request $request, $id, $workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $test = $this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, $user = null);
        if (!$test){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
        }
        $restore = $this->get("app.drive.adapter_selector")->getFileSystem()->restore($id);

        if($restore != true){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2004));
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }


    public function restoreTrashAction(Request $request,$workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $restoreTrash = $this->get("app.drive.adapter_selector")->getFileSystem()->restoreTrash($workspace_id);

        if($restoreTrash != true){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2005));
        }
        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());

    }


    public function emptyTrashAction(Request $request, $workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $empty = $this->get("app.drive.adapter_selector")->getFileSystem()->emptyTrash($workspace_id);

        if($empty != true){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2006));
        }
        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
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
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $info = $this->get("app.drive.adapter_selector")->getFileSystem()->getInfos($workspace_id, $id, $forceAccess = false);

        $infoLight = $this->selectInfoAction($info);
        if($info !=false){
            return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(), $infoLight));
        }
        return new JsonResponse($this->get("api.v1.api_status")->getError(2007));
    }

    public function contentAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $download = $this->get("app.drive.adapter_selector")->getFileSystem()->download($workspace_id, $id, false);

        if($download ==false){
            return new JsonResponse("");
        }
        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }


    public function setContentAction(Request $request, $workspace_id, $id){

        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $data = $this->get("api.v1.check")->get($request);
        $content = isset($data["content"])?$data["content"]:null;
        $url =isset($data["url"])?$data["url"]:null;

        $canAllow = $this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, $user = null);

        if (!$canAllow){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
        }

        if ($content===null && $url === null){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2008));
        }

        if ($url === null ){
            $setContent = $this->get("app.drive.adapter_selector")->getFileSystem()->setRawContent($id, $content, $newVersion = false);

        }

        if ($content === null ){

            //IMPORTANT ! Disable local files !!!
            if (strpos($url, "http://") !== false) {
                $url = "http://" . str_replace("http://", "", $url);
            } else {
                $url = "https://" . str_replace("https://", "", $url);
            }

            if (!$url || !$this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, null)) {
                return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
            } else {

                $content = file_get_contents($url);
                $setContent = $this->get("app.drive.adapter_selector")->getFileSystem()->setRawContent($id, $content);

            }
        }

        if ($setContent) {
            return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
        }

        return new JsonResponse($this->get("api.v1.api_status")->getError(2016));
    }

    public function shareObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);
        $targetgroupId = isset($content["target_workspace"])?$content["target_workspace"]:$workspace_id;

        $share = $this->get("app.drive.adapter_selector")->getFileSystem()->share($workspace_id, $id, $targetgroupId);

        if ($share == false){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2009));
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }


    public function unshareObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:manage",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);
        $targetgroupId = isset($content["target_workspace"])?$content["target_workspace"]:$workspace_id;

        $unshare = $this->get("app.drive.adapter_selector")->getFileSystem()->unshare($workspace_id, $id, $targetgroupId, false);

        if ($unshare == false){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2010));
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }

    public function renameObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $test = $this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, $user = null);
        if (!$test){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
        }

        $infos = $this->get("app.drive.adapter_selector")->getFileSystem()->getInfos($workspace_id, $id, $forceAccess = false);
        $oldFileName = $infos["name"];
        $oldDescription = $infos["description"];
        $labels = isset($infos["cache"]["labels"])?$infos["cache"]["labels"]:Array();

        $content = $this->get("api.v1.check")->get($request);
        $newFileName = isset($content["new_file_name"])?$content["new_file_name"]:$oldFileName;

        $rename = $this->get("app.drive.adapter_selector")->getFileSystem()->rename($id, $newFileName, $oldDescription, $labels);

        if (!$rename){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2011));
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }

    public function searchObjectAction(Request $request,$workspace_id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $content = $this->get("api.v1.check")->get($request);
        $query = isset($content["query"])?$content["query"]:"";

        $search = $this->get("app.drive.adapter_selector")->getFileSystem()->search($workspace_id, $query, 0, 20);

        if ($search == Array()){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2012));
        }

        if ($search == false){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2013));
        }
        $response = Array();
        foreach ($search as $element){
            $infos = $this->get("app.drive.adapter_selector")->getFileSystem()->getInfos($workspace_id, $element, false);
            $selectedInfos = $this->selectInfoAction($infos);
            array_push($response,$selectedInfos);
        }

        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(), $response));
    }


    public function listFilesAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:read",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $test = $this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, $user = null);
        if (!$test){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
        }

        $listFiles = $this->get("app.drive.adapter_selector")->getFileSystem()->listDirectory($workspace_id, $id, false);

        if($listFiles == false){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2014));
        }

        $response = Array();
        foreach ($listFiles as $file){
            $infos = $this->get("app.drive.adapter_selector")->getFileSystem()->getInfos($workspace_id, $file, false);
            $selectedInfos = $this->selectInfoAction($infos);
            array_push($response,$selectedInfos);
        }
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$response));
    }


    public function moveObjectAction(Request $request, $workspace_id, $id){
        $check = $this->get("api.v1.check")->check($request);

        if (!$check){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $isAllowedTo = $this->get("api.v1.check")->isAllowedTo($check,"drive:write",$workspace_id);

        if (!$isAllowedTo){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $test = $this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($id, $workspace_id, $user = null);
        if (!$test){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2001));
        }

        $content = $this->get("api.v1.check")->get($request);
        $newDirectory = isset($content["new_directory"])?$content["new_directory"]:$workspace_id;

        $move = $this->get("app.drive.adapter_selector")->getFileSystem()->move($id, $newDirectory, $workspace_id);
        if($move == false){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2015));
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }
}
