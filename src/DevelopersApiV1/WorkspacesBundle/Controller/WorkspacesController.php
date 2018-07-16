<?php

namespace DevelopersApiV1\WorkspacesBundle\Controller;

use PHPUnit\Util\Json;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class WorkspacesController extends Controller
{
    //all infos about app
    public function getInfoAppAction(Request $request){
        $app = $this->get("api.v1.check")->check($request);
        if (!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }
        $infos = $app->getAsArray();
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$infos));
    }


    //list members
    public function getMembersAction(Request $request,$workspace_id){
        $app = $this->get("api.v1.check")->check($request);
        if (!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $list= $this->get("app.workspace_members")->getMembers($workspace_id, null);

        if($list == false){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1000));
        }
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$list));
    }


    //list levels
    public function getListLevelsAction(Request $request, $workspace_id){
        $app = $this->get("api.v1.check")->check($request);
        if (!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $list= $this->get("app.workspace_levels")->getLevels($workspace_id, null) ;
        if($list ==false){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1001));
        }
        $response = Array();
        foreach ($list as $level){
            $l = $level->getAsArray();
            array_push($response,$l);
        }
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$response));
    }


    //list level for each user
    public function getMemberLevelAction(Request $request, $workspace_id, $id){
        $app = $this->get("api.v1.check")->check($request);
        if (!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $response  = $this->get("app.workspace_levels")->getLevel($workspace_id,$id, null);
        if ($response === null){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1002));
        }
        $response = $response->getAsArray();
        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$response));
    }

}
