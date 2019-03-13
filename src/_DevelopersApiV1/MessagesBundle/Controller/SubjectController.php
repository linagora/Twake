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

class SubjectController extends Controller
{

    private function checkIfSubjectInWorksapce($subjectId, $workspaceId){
        $subject = $this->get("app.subjectsystem")->getSubjectById($subjectId);
        return $this->checkIfStreamInWorksapce($subject->getStream()->getId(), $workspaceId);
    }

    private function checkIfStreamInWorksapce($streamId, $workspaceId){
        $stream = $this->get("app.streamsystem")->getStreamEntity($streamId);

        if($stream==null)
            return false;
        return ($stream->getWorkspace()!=null)?$stream->getWorkspace()->getId()==$workspaceId:false;
    }

    public function closeSubjectAction(Request $request, $workspace_id, $subject_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfSubjectInWorksapce($subject_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $message = $this->get("app.subjectsystem")->closeSubject($subject_id,null);

        $data = Array(
            "success" => $message,
            "errors" => Array()
        );


        if(!$message){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3013)); // Fail to close a subject
        }

        return new JsonResponse(array_merge($data,$this->get("api.v1.api_status")->getSuccess()));
    }

    //PUT /workspace/{workspace_id}/messages/subject/{subject_id}
    public function editSubjectAction(Request $request, $workspace_id, $subject_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }


        if(!$this->checkIfSubjectInWorksapce($subject_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $data = $this->get("api.v1.check")->get($request);

        $subject = $this->get("app.subjectsystem")->getSubjectById($subject_id);

        $name = isset($data["subject_name"]) ? $data["subject_name"] : $subject->getName();
        $description = isset($data["subject_description"]) ? $data["subject_description"] : $subject->getDescription();
        $isOpen = $subject->getIsOpen();

        //$idSubject,$name,$description,$isOpen,$user
        $message = $this->get("app.subjectsystem")->editSubject($subject_id,$name,$description,$isOpen,null);

        $data = Array(
            "success" => !$message ? false : true,
            "errors" => Array()
        );


        if(!$message){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3021));//Fail to edit a subject
        }

        return new JsonResponse(array_merge($data,$this->get("api.v1.api_status")->getSuccess()));
    }

    //GET  /workspace/{workspace_id}/messages/stream/{stream_id}/subjects
    public function getSubjectsFromStreamAction(Request $request, $workspace_id, $stream_id){
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

        $subjects = $this->get("app.subjectsystem")->getSubject($stream_id);

        $data = Array(
            "subjects" => $subjects,
            "errors" => Array()
        );


        if(!$subjects){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3022)); // Fail to get all subjects from a stream
        }

        return new JsonResponse(array_merge($data,$this->get("api.v1.api_status")->getSuccess()));
    }
}
