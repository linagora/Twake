<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 06/06/18
 * Time: 15:59
 */

namespace DevelopersApiV1\MessagesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class StreamController extends Controller
{
    public function getStreamListAction(Request $request, $workspace_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read");

            if(!$auth)
                return new JsonResponse("erreur app non autho");

            $streams = $this->get("app.streamsystem")->getAllPublicStreamList($workspace_id);
        }else {
            $streams = $this->get("app.streamsystem")->getAllStreamList($workspace_id);
        }

        $data = Array(
            "streams" => Array(),
            "errors" => Array()
        );


        if(!$streams){
            $data["errors"][] = 3008;
        }
        else{
            foreach ($streams as $stream){
                array_push($data["streams"], $stream->getAsArray());
            }
        }

        return new JsonResponse($data);
    }

    public function createStreamAction(Request $request, $workspace_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $data = $this->get("api.v1.check")->get($request);
        $streamName = isset($data["stream_name"]) ? $data["stream_name"] : "noname";
        $streamDescription = isset($data["stream_description"]) ? $data["stream_description"] : "";
        $streamIsPrivate = isset($data["stream_is_private"]) ? $data["stream_is_private"] : false;
        $type = isset($data["type"]) ? $data["type"] : "stream";

        //$workspaceId,$streamName,$streamDescription,$streamIsPrivate,$type
        $stream = $this->get("app.streamsystem")->createStreamFromApp($workspace_id,$streamName,$streamDescription,$streamIsPrivate,$type);

        $data = Array(
            "stream" => $stream,
            "errors" => Array()
        );


        if(!$stream){
            $data["errors"][] = 3008;
        }

        return new JsonResponse($data);
    }

    public function deleteStreamAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $stream = $this->get("app.streamsystem")->deleteStreamFromApp($stream_id);

        $data = Array(
            "success" => $stream,
            "errors" => Array()
        );


        if(!$stream){
            $data["errors"][] = 3008;
        }

        return new JsonResponse($data);
    }

    public function editStreamAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $data = $this->get("api.v1.check")->get($request);

        $old_stream = $this->get("app.streamsystem")->getStreamEntity($stream_id);
        $name = isset($data["stream_name"]) ? $data["stream_name"] : $old_stream->getName();
        $streamDescription = isset($data["stream_description"]) ? $data["stream_description"] : $old_stream->getDescription();
        $isPrivate = isset($data["is_private"]) ? $data["is_private"] : $old_stream->getIsPrivate();
        $members = $old_stream->getMembers();

        //$streamKey,$name,$streamDescription,$isPrivate,$members
        $stream = $this->get("app.streamsystem")->editStreamFromApp("s-".$stream_id,$name,$streamDescription,$isPrivate,$members);

        $data = Array(
            "stream" => $stream->getAsArray(),
            "errors" => Array()
        );


        if(!$stream){
            $data["errors"][] = 3008;
        }

        return new JsonResponse($data);
    }

    //TODO : routing, impl, test, doc
    //addMemberAction

    //TODO : routing, impl, test, doc
    //removeMemberAction
}