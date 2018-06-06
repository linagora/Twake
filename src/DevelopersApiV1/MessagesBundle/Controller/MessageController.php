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


        return new JsonResponse($message);
    }

    public function getMessageAction(Request $request,$workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if($app){
            var_dump($message_id);
            $message = $this->get("app.messages")->getMessage($message_id);
            var_dump($message);

            return new JsonResponse($message);
        }
    }

    public function getMessageChildrenAction(Request $request,$workspace_id, $message_id){

        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur");
        }

        $auth = $this->get("api.v1.check").isAllowedTo($app,"messages:read");

        if(!$auth){
            return new JsonResponse("erreur");
        }

        $content = $this->get("api.v1.check")->get($request);

        $messages = $this->get("app.messages")->getMessages(null,$message_id,null,null);

    }

    public function editMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);
        $content = $this->get("api.v1.check")->get($request);

        if($app){
            $success = $this->get("app.messages")->editMessage($message_id,$content["content"],null);
        }

    }

    public function deleteMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
    public function getStreamAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
    public function getGroupeStreamListAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
    public function getStreamListAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
    public function moveMessageInSubjectAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
    public function moveMessageInMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
    public function sendMessageWithFileAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
    public function closeSubjectAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.")->check($request);

    }
}