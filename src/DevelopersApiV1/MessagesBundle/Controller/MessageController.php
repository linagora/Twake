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
        $data = $request->$request["data"];
        $app = true;

        //$app = $this->get("api.")->check($request);

        if($app){
            $subjectId = isset($data["subject_id"]) ? $data["subject_id"] : null;
            $userId = isset($data["user_id"]) ? $data["user_id"] : null;
            $appId = 0;//$app->getId();
            $url = "";
            if(isset($data["iframe"]) ){
                $url = $data["iframe"]["url"];
            }
            else
                $url = $data["content"];

            $message = $this->get("app.messages")->sendMessage($userId, $stream_id, true, $appId, false, null, $workspace_id, $subjectId, Array("iframe" => $url));


            return new JsonResponse($message);
        }

        return new JsonResponse($app["Auth error"]);
    }

    public function getMessageAction($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

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
        $app = true;

        //$app = $this->get("api.")->check($request);
        $data = $request->$request["data"];

        if($app){
            $success = $this->get("app.messages")->editMessage($message_id,$data["content"],null);
        }

    }

    public function deleteMessageAction($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
    public function getStream($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
    public function getGroupeStreamList($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
    public function getStreamList($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
    public function moveMessageInSubject($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
    public function moveMessageInMessage($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
    public function sendMessageWithFile($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
    public function closeSubject($workspace_id, $message_id){
        $app = true;

        //$app = $this->get("api.")->check($request);

    }
}