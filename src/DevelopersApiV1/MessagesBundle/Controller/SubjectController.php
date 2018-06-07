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
    public function closeSubjectAction(Request $request, $workspace_id, $subject_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = $this->get("app.subjectsystem")->closeSubject($subject_id,null);

        $data = Array(
            "success" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3012;
        }

        return new JsonResponse($data);
    }

    //PUT /workspace/{workspace_id}/messages/subject/{subject_id}
    public function editSubjectAction(Request $request, $workspace_id, $subject_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

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
            $data["errors"][] = 3012;
        }

        return new JsonResponse($data);
    }

    //GET  /workspace/{workspace_id}/messages/stream/{stream_id}/subjects
    public function getSubjectsFromStreamAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage",$workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $subjects = $this->get("app.subjectsystem")->getSubject($stream_id);

        $data = Array(
            "subjects" => $subjects,
            "errors" => Array()
        );


        if(!$subjects){
            $data["errors"][] = 3012;
        }

        return new JsonResponse($data);
    }
}