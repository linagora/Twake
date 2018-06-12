<?php

namespace WebsiteApi\DiscussionBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\DiscussionBundle\Entity\StreamMember;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;


class DiscussionController extends Controller
{

    public function getMessageAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            if(($request->request->get("discussionKey")==null && $request->request->get("discussionKey")!=0) ||  ($request->request->get("offset")==null && $request->request->get("offset")!=0) ){
                $data["errors"][] = "missingargument";
            }
            else{
                $messages = [];
                $offsetId= intval($request->request->get("offsetId"));
                $messages = $this->get("app.messages")->getMessages($request->request->get("discussionKey"),$offsetId,$request->request->get("subject"),$this->getUser());

                error_log(count($messages));
                $data["data"] = $messages;
                error_log("nb message : ".count($messages));
            }
        }
        return new JsonResponse($data);
    }

    public function getSubjectAction(Request $request){
    	$data = Array(
    		'errors' => Array(),
    		'data' => Array()
    	);

        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            if($request->request->get("discussionKey")!=null){
                $discussionInfos = $this->get("app.messages")->convertKey($request->request->get("discussionKey"), $this->getUser());
                if($discussionInfos["type"] == "S"){
                    $stream = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($discussionInfos["id"]);
                    if($stream != null){
                        $link = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:StreamMember")->findBy(Array("user"=>$this->getUser(),"stream"=>$stream));
                        if( !$stream->getIsPrivate() || $link != null ){
                            $subjects = $this->get("app.subjectSystem")->getSubject($stream);
                            $data["data"] = $subjects;
                        }
                        else{
                            $data['errors'][] = "notindiscussion";
                        }
                    }
                    else{
                        $data['errors'][] = "discussionnotfound";
                    }
                }
                else if($discussionInfos["type"] == "U"){
                    $data["errors"][] = "userDiscussion";
                    // TODO manage user discussion
                }
            }
            else{
                $data["errors"][] = "missingarguments";
            }
        }
        return new JsonResponse($data);
    }


    public function getSubjectMessageAction(Request $request){
		$data = Array(
		    		'errors' => Array(),
		    		'data' => Array()
		    	);

        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            if($request->request->get("subject") != null){
                $subject = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Subject")->find($request->request->get("subject"));
                if($subject == null){
                    $data["errors"][] = "subjectnotfound";
                }
                else{
                    $link = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("stream"=>$subject->getStream(),"user"=>$this->getUser()));
                    if($subject->getStream()->getIsPrivate() && $link == null){
                        $data["errors"][] = "notallowed";
                    }
                    else{
                        $messages = $this->get("app.subjectSystem")->getMessages($subject);
                        $retour = [];
                        foreach ($messages as $message) {
                            $messageArray = $this->get("app.messages")->getMessageAsArray($message,true);
                            if($messageArray!=null){
                                $retour[] = $messageArray;
                            }
                        }
                        $data["data"] = $retour;
                    }
                }
            }
            else{
                $data["errors"][] = "missingarguments";
            }
        }
        return new JsonResponse($data);
    }

	public function getStreamsAction(Request $request){
		$data = Array(
			'errors' => Array(),
			'data' => Array()
		);

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
            if($request->request->get("gid")==null ){
                $data["errors"] = "missingarguments";
            }
            else{
            	$streams = $this->get("app.streamSystem")->getStreamList($request->request->get("gid"),$this->getUser());
            	if($streams){
                    $data["data"] = $streams;
                }
            }

        }
		return new JsonResponse($data);
	}

	public function getStreamAction(Request $request){
		$data = Array(
			'errors' => Array(),
			'data' => Array()
		);

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
			if($request->request->get("key")==null ){
				$data["errors"] = "missingarguments";
			}
			else{
				$stream = $this->get("app.messages")->getStream($request->request->get("key"),$this->getUser());
				if($this->get("app.messages")->isAllowed($stream, $this->getUser())){
					$stream = $stream["object"]->getAsArray();
					$data["data"] = $stream;
				}
			}

		}
		return new JsonResponse($data);
	}


	public function searchMessageAction(Request $request){
		$data = Array(
			'errors' => Array(),
			'data' => Array()
		);

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
			$discussionInfos = $this->get("app.messages")->convertKey($request->request->get("discussionKey"), $this->getUser());
			$messages = $this->get("app.messages")->searchMessage($discussionInfos["id"],$request->request->get("content"),intval($request->request->get("from")),$request->request->get("dateStart"),$request->request->get("dateEnd"),null,$this->getUser());
            $retour = Array();
			foreach ($messages as $message) {
				$retour[] = $message->getAsArray();
			}
			$data["data"] = $retour;
		}
		return new JsonResponse($data);
	}

	public function getDriveMessageAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );
        $securityContext = $this->get('security.authorization_checker');

		$stream = $this->get("app.messages")->getStream($request->request->get("discussionKey"), $this->getUser()->getId());
        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED') || !$this->get("app.messages")->isAllowed($stream, $this->getUser())) {
            $data['errors'][] = "notconnected";
        }
        else {
            $messages = $this->get("app.messages")->searchDriveMessage($request->request->get("discussionKey"),$this->getUser());
            $data["data"] = $messages;

        }
        return new JsonResponse($data);
    }

    public function muteAction(Request $request){
	    $data = Array(
		    'errors' => Array(),
		    'data' => Array()
	    );

	    $securityContext = $this->get('security.authorization_checker');
	    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
		    $data['errors'][] = "notconnected";
	    }
	    else {
		    $streamId = $request->request->getInt("id");
		    $muteValue = $request->request->getBoolean("mute");
		    $result = $this->get("app.streamSystem")->mute($this->getUser(), $streamId, $muteValue);
		    $data["data"]["mute"] = ($result?$muteValue:false);
	    }

	    return new JsonResponse($data);
    }

    public function getLastMessagesAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $user = $this->getUser()->getId();

        $list = $this->get('app.messages_master')->getLastMessages($user);
        if(count($list)==0){
            $data["errors"][] = "list empty";
        }else {

            $response = array();
            foreach ($list as $element) {
                if ($element[1] != null){
                    $responseElement = array();
                    $infoStream = $element[0]->getAsArray();
                    $infoMessage = $element[1]->getAsArrayForClient();
                    $infoStreamMember = $element[2]->getAsArray();
                    array_push($responseElement, $infoStream);
                    array_push($responseElement,$infoMessage);
                    array_push($responseElement,$infoStreamMember);
                    $response[] = $responseElement;
                }
            }

            $data["data"] = $response;
        }
        return new JsonResponse($data);
    }



}
