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
    private function checkIfStreamInWorksapce($streamId, $workspaceId){
        $stream = $this->get("app.streamsystem")->getStreamEntity($streamId);

        if($stream==null)
            return false;
        return ($stream->getWorkspace()!=null)?$stream->getWorkspace()->getId()==$workspaceId:false;
    }

    public function getStreamListAction(Request $request, $workspace_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read",$workspace_id);

            if(!$auth)
                return new JsonResponse($this->get("api.v1.api_status")->getError(2));

            $streams = $this->get("app.streamsystem")->getAllPublicStreamList($workspace_id);
        }else {
            $streams = $this->get("app.streamsystem")->getAllStreamList($workspace_id);
        }

        $data = Array(
            "streams" => Array(),
            "errors" => Array()
        );


        if(!$streams){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3009)); // Fail to get stream list
        }
        else{
            foreach ($streams as $stream){
                array_push($data["streams"], $stream->getAsArray());
            }
        }

        return new JsonResponse(array_merge($data,$this->get("api.v1.api_status")->getSuccess()));
    }

    public function createStreamAction(Request $request, $workspace_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        $data = $this->get("api.v1.check")->get($request);
        $streamName = isset($data["stream_name"]) ? $data["stream_name"] : "noname";
        $streamDescription = isset($data["stream_description"]) ? $data["stream_description"] : "";
        $streamIsPrivate = isset($data["stream_is_private"]) ? $data["stream_is_private"] : false;
        $type = isset($data["type"]) ? $data["type"] : "stream";
        $members = isset($data["members"]) ? $data["members"] : Array();
        //$workspaceId,$streamName,$streamDescription,$streamIsPrivate,$type
        $stream = $this->get("app.streamsystem")->createStreamFromApp($workspace_id, $streamName, $streamDescription, $streamIsPrivate, $type, $members, $this->getUser()->getId());

        $data = Array(
            "stream" => $stream,
            "errors" => Array()
        );


        if(!$stream){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3016)); //Fail to create a stream
        }

        return new JsonResponse(array_merge($data,$this->get("api.v1.api_status")->getSuccess()));
    }

    public function deleteStreamAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $stream = $this->get("app.streamsystem")->deleteStreamFromApp($stream_id);

        $data = Array(
            "success" => $stream,
            "errors" => Array()
        );


        if(!$stream){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3015)); // Fail to delete a stream
        }

        return new JsonResponse(array_merge($data,$this->get("api.v1.api_status")->getSuccess()));
    }

    public function editStreamAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $data = $this->get("api.v1.check")->get($request);

        $old_stream = $this->get("app.streamsystem")->getStreamEntity($stream_id);
        $name = isset($data["stream_name"]) ? $data["stream_name"] : $old_stream->getName();
        $streamDescription = isset($data["stream_description"]) ? $data["stream_description"] : $old_stream->getDescription();
        $isPrivate = isset($data["is_private"]) ? $data["is_private"] : $old_stream->getIsPrivate();
        $members = $old_stream->getMembers();

        //$streamKey,$name,$streamDescription,$isPrivate,$members
        $stream = $this->get("app.streamsystem")->editStreamFromApp("s-" . $stream_id, $name, $streamDescription, $isPrivate, $members, $this->getUser()->getId());

        $data = Array(
            "stream" => $stream->getAsArray()
        );


        if(!$stream){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3017));// Fail to edit a stream
        }

        return new JsonResponse(array_merge($data,$this->get("api.v1.api_status")->getSuccess()));
    }

    //POST /workspace/{workspace_id}/messages/stream/{stream_id}/member/{user_id}
    public function addMemberAction(Request $request, $workspace_id,$stream_id,$user_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $stream = $this->get("app.streamsystem")->getStreamEntity($stream_id);
        $streamKey = "s-".$stream->getId();
        $name = $stream->getName();
        $streamDescription = $stream->getDescription();
        $isPrivate = $stream->getIsPrivate();
        $members = $stream->getMembers();
        $add = true;
        $membersId = Array();
        foreach ($members as $member){
            array_push($membersId, $member->getId());
            if($user_id==$member->getId())
                $add = false;
        }
        if($add){
            array_push($membersId, $user_id);
            //$streamKey,$name,$streamDescription,$isPrivate,$members
            $success = $this->get("app.streamsystem")->editStreamFromApp($streamKey, $name, $streamDescription, $isPrivate, $membersId, $this->getUser()->getId());

        }



        if(!$success){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3019)); // fail to add a member
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }

    //DELETE /workspace/{workspace_id}/messages/stream/{stream_id}/member/{user_id}
    public function removeMemberAction(Request $request, $workspace_id,$stream_id,$user_id)
    {
        $app = $this->get("api.v1.check")->check($request);

        if (!$app) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app, "messages:manage",$workspace_id);

        if (!$auth) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $stream = $this->get("app.streamsystem")->getStreamEntity($stream_id);
        $streamKey = "s-".$stream->getId();
        $name = $stream->getName();
        $streamDescription = $stream->getDescription();
        $isPrivate = $stream->getIsPrivate();
        $members = $stream->getMembers();
        $remove = false;
        $membersId = Array();
        foreach ($members as $member){
            if($user_id==$member->getId())
                $remove = true;
            else
                array_push($membersId, $member->getId());
        }
        if($remove){
            //$streamKey,$name,$streamDescription,$isPrivate,$members
            $success = $this->get("app.streamsystem")->editStreamFromApp($streamKey, $name, $streamDescription, $isPrivate, $membersId, $this->getUser()->getId());

        }

        if (!$success) {
            return new JsonResponse($this->get("api.v1.api_status")->getError(3020)); // Fail to remove a member
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }
}
