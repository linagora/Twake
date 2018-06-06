<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 05/06/18
 * Time: 15:46
 */

namespace DevelopersApiV1\MessagesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class MessageController extends Controller
{
    //TODO : doc
    public function sendMessageAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $data = $this->get("api.v1.check")->get($request);

        $subjectId = isset($data["subject_id"]) ? $data["subject_id"] : 0;
        $userId = isset($data["user_id"]) ? $data["user_id"] : 0;
        $appId = $app->getId();
        $url = null;
        if(isset($data["iframe"]) ){
            $url = Array("iframe" => $data["iframe"]["url"]);
        }

        $content = isset($data["content"]) ? $data["content"] : null;

        //sendMessage($senderId, $key, $isApplicationMessage, $applicationId, $isSystemMessage, $content, $workspace, $subjectId = null, $messageData = null, $notify = true, $front_id = "")
        $message = $this->get("app.messages")->sendMessage($userId, "s-".$stream_id, true, $appId, false, $content, $workspace_id, $subjectId, $url);


        $data = Array(
            "message_id" => null,
            "errors" => Array()
        );

        if(!$message){
            $data["errors"][] = 3001;
        }
        else
            $data["message_id"] = $message->getId();

        return new JsonResponse($data);
    }

    //TODO : doc
    public function getMessageAction(Request $request,$workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = $this->get("app.messages")->getMessage($message_id);

        $data = Array(
            "message" => null,
            "errors" => Array()
        );

        if(!$message|| $message==null){
            $data["errors"][] = 3002;
        }
        else
            $data["message"] = $message->getContent();

        return new JsonResponse($data);
    }

    //TODO : impl, test, doc
    public function getMessageChildrenAction(Request $request,$workspace_id, $message_id){
        //SubjectSystem : getMessages
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $messages = null;

        $data = Array(
            "messages" => Array(),
            "errors" => Array()
        );


        if(!$messages|| $messages==null){
            $data["errors"][] = 3003;
        }
        else {
            $data_msg = Array();
            foreach($messages as $msg)
                array_push($data_msg, $msg->getContent());
            $data["messages"] = $data_msg;
        }

        return new JsonResponse($data);
    }

    //TODO : doc
    public function editMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $content = $this->get("api.v1.check")->get($request);

        $success = $this->get("app.messages")->editMessageFromApp($message_id,$content["content"]);

        $data = Array(
            "success" => $success,
            "errors" => Array()
        );


        if(!$success){
            $data["errors"][] = 3004;
        }

        return new JsonResponse($data);
    }

    //TODO : doc
    public function deleteMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = $this->get("app.messages")->deleteMassageFromApp($message_id);

        $data = Array(
            "message" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3005;
        }

        return new JsonResponse($data);
    }

    //TODO : impl, test, doc
    public function getStreamContentAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = null;

        $data = Array(
            "message" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3006;
        }

        return new JsonResponse($data);
    }

    //TODO : doc
    public function changeMessageToSubjectAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = $this->get("app.subjectsystem")->createSubjectFromMessageFromApp($message_id);

        $data = Array(
            "message" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3009;
        }

        return new JsonResponse($data);
    }

    //TODO : doc
    public function moveMessageInMessageAction(Request $request, $workspace_id, $response_message_id,$main_message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = $this->get("app.messages")->moveMessageInMessage($main_message_id,$response_message_id,null);

        $data = Array(
            "message" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3010;
        }

        return new JsonResponse($data);
    }

    //TODO : doc
    public function moveMessageInSubjectAction(Request $request, $workspace_id, $message_id, $subject_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = $this->get("app.messages")->moveMessageInSubject($subject_id,$message_id,null);

        $data = Array(
            "message" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3013;
        }

        return new JsonResponse($data);
    }

    //TODO : impl, test, doc
    public function sendMessageWithFileAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write");

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        $message = null;

        $data = Array(
            "message" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3011;
        }

        return new JsonResponse($data);
    }

    //TODO : doc
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
            "message" => $message,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3012;
        }

        return new JsonResponse($data);
    }

}