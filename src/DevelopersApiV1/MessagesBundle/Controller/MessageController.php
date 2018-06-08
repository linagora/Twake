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
        if($message==null)
            return false;

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
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));


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
            "message_id" => null
        );

        if(!$message){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3002));
        }
        else
            $data["message_id"] = $message->getAsArrayForClient();

        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$data));
    }

    public function getMessageAction(Request $request,$workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $message = $this->get("app.messages")->getMessage($message_id, $workspace_id);

        $data = Array(
            "message" => null
        );

        if(!$message|| $message==null){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3003));//Fail to get message
        }
        else
            $data["message"] = $message->getContent();

        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$data));
    }

    //GET /workspace/{workspace_id}/messages/message/{message_id}/children
    public function getMessageChildrenAction(Request $request,$workspace_id, $message_id){
        //SubjectSystem : getMessages
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

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
            "messages" => $messages
        );


        if(!$messages|| $messages==null){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3004));// Fail to get message children
        }

        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$data));
    }

    public function editMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $content = $this->get("api.v1.check")->get($request);

        $success = $this->get("app.messages")->editMessageFromApp($message_id,$content["content"]);

        $data = Array(
            "success" => $success,
            "errors" => Array()
        );


        if(!$success){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3005)); // Fail to edit a message
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }

    public function deleteMessageAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $message = $this->get("app.messages")->deleteMassageFromApp($message_id);


        if(!$message){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3006)); //Fail to delete a message
        }

        return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }

    //GET /workspace/{workspace_id}/messages/stream/{stream_id}
    public function getStreamContentAction(Request $request, $workspace_id, $stream_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:read", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfStreamInWorksapce($stream_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $messagesRaw = $this->get("app.messages")->getMessagesFromStream($stream_id);

        if(!$messagesRaw)
            return new JsonResponse($this->get("api.v1.api_status")->getError(3007));//Fail to get stream content

        $messages = Array();

        foreach ($messagesRaw as $message) {
            array_push($messages,$message->getAsArrayForClient());
        }

        $data = Array(
            "messages" => $messages
        );

        return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$data));
    }

    public function changeMessageToSubjectAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));
        $message = $this->get("app.subjectsystem")->createSubjectFromMessageFromApp($message_id);

        $data = Array(
            "subject_id" => $message["id"]
        );


        if(!$message){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3010));//Fail to change message in subject
        }
        else
            return new JsonResponse(array_merge($this->get("api.v1.api_status")->getSuccess(),$data));
    }

    public function moveMessageInMessageAction(Request $request, $workspace_id, $response_message_id,$main_message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfMessageInWorksapce($response_message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));
        if(!$this->checkIfMessageInWorksapce($main_message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));
        $message = $this->get("app.messages")->moveMessageInMessage($main_message_id,$response_message_id,null);

        $data = Array(
            "message" => !$message ? false : true,
            "errors" => Array()
        );


        if(!$message){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3011));//Fail to move a message in a message
        }
        else
            return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }

    public function moveMessageInSubjectAction(Request $request, $workspace_id, $message_id, $subject_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:manage", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
        }

        if(!$this->checkIfMessageInWorksapce($message_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        if(!$this->checkIfSubjectInWorksapce($subject_id,$workspace_id))
            return new JsonResponse($this->get("api.v1.api_status")->getError(3000));

        $message = $this->get("app.messages")->moveMessageInSubject($subject_id,$message_id,null);

        if(!$message){
            return new JsonResponse($this->get("api.v1.api_status")->getError(3014));//Fail to move message in subject
        }
        else
            return new JsonResponse($this->get("api.v1.api_status")->getSuccess());
    }

    //NOTTODO : impl, test, doc
    /*public function sendMessageWithFileAction(Request $request, $workspace_id, $message_id){
        $app = $this->get("api.v1.check")->check($request);

        if(!$app){
            return new JsonResponse($this->get("api.v1.api_status")->getError(1));
        }

        $auth = $this->get("api.v1.check")->isAllowedTo($app,"messages:write", $workspace_id);

        if(!$auth){
            return new JsonResponse($this->get("api.v1.api_status")->getError(2));
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
