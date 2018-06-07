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
            return new JsonResponse("Pas check");
        }
        $infos = $app->getAsArray();
        return new JsonResponse($infos);
    }

    //list members
    public function getMembersAction(Request $request,$workspace_id){
        $app = $this->get("api.v1.check")->check($request);
        if (!$app){
            return new JsonResponse("Pas check");
        }

        $list= $this->get("app.workspace_members")->getMembers($workspace_id, null);

        if($list == false){
            return new JsonResponse("erreur");
        }
        return new JsonResponse($list);
    }

    //list levels
    public function getListLevelsAction(Request $request, $workspace_id){
        $app = $this->get("api.v1.check")->check($request);
        if (!$app){
            return new JsonResponse("Pas check");
        }

        $list= $this->get("app.workspace_levels")->getLevels($workspace_id, null) ;
        if($list ==false){
            return new JsonResponse("erreur");
        }

        $response = Array();
        foreach ($list as $level){
            $l = $level->getAsArray();
            array_push($response,$l);
        }
        return new JsonResponse($response);
    }

    //list level for each user
    public function getMemberLevelAction(Request $request, $workspace_id, $id){
        $app = $this->get("api.v1.check")->check($request);
        if (!$app){
            return new JsonResponse("Pas check");
        }

        $response  = $this->get("app.workspace_levels")->getLevel($workspace_id,$id, null);
        if ($response === null){
            return new JsonResponse("erreur");
        }

        $response = $response->getAsArray();

        return new JsonResponse($response);
    }

}
