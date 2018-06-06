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

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

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

    //TODO : routing, impl, test, doc
    //createSubject

    //TODO : routing, impl, test, doc
    //editSubject

    //TODO : routing, impl, test, doc
    //getSubjectsFromStream
}