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

    private function checkIfMessageInWorksapce($messageId, $workspaceId){
        $message = $this->get("app.messages")->getMessage($messageId, $workspaceId);

        return ($message->getStreamReciever()!=null)?$this->checkIfStreamInWorksapce($message->getStreamReciever()->getId(),$workspaceId)  :false;
    }
    private function checkIfStreamInWorksapce($streamId, $workspaceId){
        $stream = $this->get("app.streamsystem")->getStreamEntity($streamId);

        if($stream==null)
            return false;
        return ($stream->getWorkspace()!=null)?$stream->getWorkspace()->getId()==$workspaceId:false;
    }
    public function sendMessageAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse("bad stream");


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

    public function getMessageAction(Request $request,$workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse("bad stream");

        $message = $this->get("app.messages")->getMessage($message_id, $workspace_id);

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

    //GET /workspace/{workspace_id}/messages/message/{message_id}/children
    public function getMessageChildrenAction(Request $request,$workspace_id, $message_id){
        //SubjectSystem : getMessages
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse("bad stream");

        $subject = $this->get("app.subjectsystem")->getSubjectFromMessage($message_id);
        if($subject==null){
            //Get all response from message_id
            $messageParent = $this->get("app.messages")->getMessage($message_id);

            $responseMessages = $this->get("app.messages")->getResponseMessages($message_id);

            $messages["first_message"] = $messageParent->getAsArrayForClient();
            $ar = Array();

            foreach ($responseMessages as $responseMessage) {
                array_push($ar,$responseMessage->getAsArrayForClient());
            }

            $messages["response"] = $ar;
        }else{
            //Return all response from the subject
            $messages = $this->get("app.subjectsystem")->getMessages($subject->getId());
            $ar = Array();

            foreach ($messages as $message){
                array_push($ar,$message->getAsArrayForClient());
            }
            $messages = $ar;
        }

        $data = Array(
            "messages" => $messages,
            "errors" => Array()
        );


        if(!$messages|| $messages==null){
            $data["errors"][] = 3003;
        }
        else {
        }

        return new JsonResponse($data);
    }

    public function editMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse("bad stream");

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

    public function deleteMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse("bad stream");

        $message = $this->get("app.messages")->deleteMassageFromApp($message_id);

        $data = Array(
            "message" => !$message ? false : true,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3005;
        }

        return new JsonResponse($data);
    }

    //GET /workspace/{workspace_id}/messages/stream/{stream_id}
    public function getStreamContentAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse("bad stream");

        $messagesRaw = $this->get("app.messages")->getMessagesFromStream($stream_id);

        $messages = Array();

        foreach ($messagesRaw as $message) {
            array_push($messages,$message->getAsArrayForClient());
        }

        $data = Array(
            "messages" => $messages,
            "errors" => Array()
        );
        return new JsonResponse($data);
    }

    public function changeMessageToSubjectAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse("bad stream");
        $message = $this->get("app.subjectsystem")->createSubjectFromMessageFromApp($message_id);

        $data = Array(
            "subject_id" => $message["id"],
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3009;
        }

        return new JsonResponse($data);
    }

    public function moveMessageInMessageAction(Request $request, $workspace_id, $response_message_id,$main_message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfMessageInWorksapce($response_message_id,$workspace_id))
            return new JsonResponse("bad stream");
        if(!$this->checkIfMessageInWorksapce($main_message_id,$workspace_id))
            return new JsonResponse("bad stream");
        $message = $this->get("app.messages")->moveMessageInMessage($main_message_id,$response_message_id,null);

        $data = Array(
            "message" => !$message ? false : true,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3010;
        }

        return new JsonResponse($data);
    }

    public function moveMessageInSubjectAction(Request $request, $workspace_id, $message_id, $subject_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse("erreur app non autho");
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse("bad stream");

        if(!$this->checkIfSubjectInWorksapce($subject_id,$workspace_id))
            return new JsonResponse("bad stream");

        $message = $this->get("app.messages")->moveMessageInSubject($subject_id,$message_id,null);

        $data = Array(
            "success" => !$message ? false : true,
            "errors" => Array()
        );


        if(!$message){
            $data["errors"][] = 3013;
        }

        return new JsonResponse($data);
    }

    //NOTTODO : impl, test, doc
    /*public function sendMessageWithFileAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse("erreur app inconnue");
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write", $workspace_id);

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
    }*/

}